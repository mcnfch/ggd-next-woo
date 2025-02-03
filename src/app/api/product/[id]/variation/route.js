import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

const dbConfig = {
  host: 'localhost',
  user: 'wpuser',
  password: 'way2mcnfch@WSX',
  database: 'woo_groovy'
};

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const id = request.url.split('/').pop().split('?')[0];
    
    const connection = await mysql.createConnection(dbConfig);
    await connection.execute('SET SESSION group_concat_max_len = 1000000');

    const [variations] = await connection.execute(`
      SELECT 
        p.*,
        GROUP_CONCAT(
          DISTINCT CONCAT(pm.meta_key, ':', pm.meta_value)
          ORDER BY pm.meta_key
        ) as meta_data,
        (
          SELECT guid
          FROM wp_posts thumb
          JOIN wp_postmeta thumb_meta ON thumb_meta.meta_value = thumb.ID
          WHERE thumb_meta.post_id = p.ID 
          AND thumb_meta.meta_key = '_thumbnail_id'
          AND thumb.post_type = 'attachment'
          LIMIT 1
        ) as thumbnail_url
      FROM wp_posts p
      LEFT JOIN wp_postmeta pm ON p.ID = pm.post_id
      WHERE p.post_type = 'product_variation'
      AND p.post_parent = ?
      GROUP BY p.ID
    `, [id]);

    // Process meta data
    const processedVariations = variations.map(variation => {
      const metaObj = {};
      if (variation.meta_data) {
        variation.meta_data.split(',').forEach(meta => {
          const [key, value] = meta.split(':');
          if (key.startsWith('attribute_')) {
            metaObj[key] = value;
          } else if (key === '_regular_price') {
            metaObj.regular_price = value;
          } else if (key === '_sale_price') {
            metaObj.sale_price = value;
          }
        });
      }

      return {
        id: variation.ID,
        sku: variation.post_name,
        price: metaObj.sale_price || metaObj.regular_price,
        regular_price: metaObj.regular_price,
        sale_price: metaObj.sale_price,
        attributes: Object.entries(metaObj)
          .filter(([key]) => key.startsWith('attribute_'))
          .map(([key, value]) => ({
            name: key.replace('attribute_', ''),
            option: value
          })),
        image: variation.thumbnail_url
      };
    });

    return NextResponse.json(processedVariations);
  } catch (error) {
    console.error('Error fetching variations:', error);
    return NextResponse.json({ error: 'Failed to fetch variations' }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const { attributes } = await request.json();
    const resolvedParams = await params;
    const productId = resolvedParams.id;

    const connection = await mysql.createConnection(dbConfig);
    await connection.execute('SET SESSION group_concat_max_len = 1000000');

    // Get all variations for the product
    const [variations] = await connection.execute(`
      SELECT 
        p.*,
        GROUP_CONCAT(
          DISTINCT CONCAT(pm.meta_key, ':', pm.meta_value)
          ORDER BY pm.meta_key
        ) as meta_data
      FROM wp_posts p
      LEFT JOIN wp_postmeta pm ON p.ID = pm.post_id
      WHERE p.post_type = 'product_variation'
      AND p.post_parent = ?
      GROUP BY p.ID
    `, [productId]);

    if (!variations || variations.length === 0) {
      return NextResponse.json(
        { error: 'No variations found for this product' },
        { status: 404 }
      );
    }

    // Normalize the requested attributes by ensuring they have the correct prefix
    const normalizedRequestedAttributes = Object.fromEntries(
      Object.entries(attributes).map(([key, value]) => {
        if (key.startsWith('attribute_')) {
          return [key, value];
        } else if (key.startsWith('pa_')) {
          return [`attribute_${key}`, value];
        } else {
          return [`attribute_pa_${key}`, value];
        }
      })
    );

    // Find the matching variation
    const matchingVariation = variations.find(variation => {
      if (!variation.meta_data) return false;

      const variationAttrs = variation.meta_data.split(',').reduce((acc, attr) => {
        const [key, value] = attr.split(':');
        if (key && value) {
          acc[key] = value;
        }
        return acc;
      }, {});

      // Check if all requested attributes match the variation
      return Object.entries(normalizedRequestedAttributes).every(([key, value]) => 
        variationAttrs[key] === value
      );
    });

    if (!matchingVariation) {
      return NextResponse.json(
        { 
          error: 'Variation not found', 
          requestedAttributes: normalizedRequestedAttributes,
          availableVariations: variations.map(v => v.meta_data)
        },
        { status: 404 }
      );
    }

    // Format the response: include id, sku, price, image, and attributes; omit stock info
    const metaObj = {};
    if (matchingVariation.meta_data) {
      matchingVariation.meta_data.split(',').forEach(meta => {
        const [key, value] = meta.split(':');
        if (key.startsWith('attribute_')) {
          metaObj[key] = value;
        } else if (key === '_regular_price') {
          metaObj.regular_price = value;
        } else if (key === '_sale_price') {
          metaObj.sale_price = value;
        }
      });
    }

    const formattedResponse = {
      id: matchingVariation.ID,
      sku: matchingVariation.post_name,
      price: metaObj.sale_price || metaObj.regular_price,
      regular_price: metaObj.regular_price,
      sale_price: metaObj.sale_price,
      attributes: Object.entries(metaObj)
        .filter(([key]) => key.startsWith('attribute_'))
        .map(([key, value]) => ({
          name: key.replace('attribute_', ''),
          option: value
        })),
      image: matchingVariation.thumbnail_url
    };

    const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

    // Add cart data to Redis
    const cartData = await redis.get(`cart:${productId}`);
    if (!cartData) {
      await redis.set(`cart:${productId}`, JSON.stringify({ variations: [formattedResponse] }));
    } else {
      const existingCartData = JSON.parse(cartData);
      existingCartData.variations.push(formattedResponse);
      await redis.set(`cart:${productId}`, JSON.stringify(existingCartData));
    }

    await redis.quit();

    return NextResponse.json(formattedResponse);
  } catch (error) {
    console.error('Error finding variation:', error);
    return NextResponse.json(
      { error: 'Error finding variation', details: error.message },
      { status: 500 }
    );
  }
}

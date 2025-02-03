import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

const dbConfig = {
  host: 'localhost',
  user: 'wpuser',
  password: 'way2mcnfch@WSX',
  database: 'woo_groovy'
};

export async function POST(request) {
  try {
    const body = await request.json();
    const { productId, attributes } = body;

    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    if (!attributes || typeof attributes !== 'object') {
      return NextResponse.json({ error: 'Attributes are required' }, { status: 400 });
    }

    const connection = await mysql.createConnection(dbConfig);

    try {
      // Get all variations for this product with a corrected GROUP BY clause
      const [variations] = await connection.execute(`
        SELECT 
          p.ID as variation_id,
          p.post_title,
          GROUP_CONCAT(DISTINCT CONCAT(pm.meta_key, '=', pm.meta_value)) as attributes,
          MAX(CASE WHEN price.meta_key = '_regular_price' THEN price.meta_value END) as price,
          MAX(CASE WHEN sku.meta_key = '_sku' THEN sku.meta_value END) as sku,
          MAX(CASE WHEN stock.meta_key = '_stock_status' THEN stock.meta_value END) as stock_status,
          MAX(CASE WHEN img.meta_key = '_thumbnail_id' THEN img.meta_value END) as image_id
        FROM wp_posts p
        LEFT JOIN wp_postmeta pm ON p.ID = pm.post_id AND pm.meta_key LIKE 'attribute_%'
        LEFT JOIN wp_postmeta price ON p.ID = price.post_id AND price.meta_key = '_regular_price'
        LEFT JOIN wp_postmeta sku ON p.ID = sku.post_id AND sku.meta_key = '_sku'
        LEFT JOIN wp_postmeta stock ON p.ID = stock.post_id AND stock.meta_key = '_stock_status'
        LEFT JOIN wp_postmeta img ON p.ID = img.post_id AND img.meta_key = '_thumbnail_id'
        WHERE p.post_parent = ?
        AND p.post_type = 'product_variation'
        GROUP BY p.ID, p.post_title
      `, [productId]);

      // Find matching variation
      const matchingVariation = variations.find(variation => {
        if (!variation.attributes) return false;
        
        const variationAttrs = new Map(
          variation.attributes.split(',')
            .map(attr => {
              const [key, value] = attr.split('=');
              return [key.replace('attribute_', ''), value];
            })
        );

        // Check if all selected options match this variation
        return Object.entries(attributes).every(([name, value]) => {
          const variationValue = variationAttrs.get(`pa_${name}`);
          return variationValue === value;
        });
      });

      if (!matchingVariation) {
        return NextResponse.json({ 
          error: 'Variation not found',
          debug: {
            productId,
            requestedAttributes: attributes,
            availableVariations: variations.map(v => ({
              id: v.variation_id,
              attributes: v.attributes
            }))
          }
        }, { status: 404 });
      }

      // Get image URL if there's an image ID
      let imageUrl = null;
      if (matchingVariation.image_id) {
        const [images] = await connection.execute(
          'SELECT guid FROM wp_posts WHERE ID = ?',
          [matchingVariation.image_id]
        );
        if (images.length > 0) {
          imageUrl = images[0].guid;
        }
      }

      return NextResponse.json({
        id: matchingVariation.variation_id,
        price: matchingVariation.price,
        sku: matchingVariation.sku,
        stock_status: matchingVariation.stock_status,
        image: imageUrl
      });

    } finally {
      await connection.end();
    }
  } catch (error) {
    console.error('Error in variation route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

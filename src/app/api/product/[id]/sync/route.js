import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

const dbConfig = {
  host: 'localhost',
  user: 'wpuser',
  password: 'way2mcnfch@WSX',
  database: 'woo_groovy'
};

export async function POST(request, { params }) {
  const { id } = params;

  try {
    const connection = await mysql.createConnection(dbConfig);
    await connection.execute('SET SESSION group_concat_max_len = 1000000');

    const [products] = await connection.execute(`
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
        ) as thumbnail_url,
        (
          SELECT GROUP_CONCAT(
            DISTINCT CONCAT('gallery_image:', attach.guid)
            ORDER BY FIELD(attach.ID, gallery_meta.meta_value)
          )
          FROM wp_postmeta gallery_meta
          JOIN wp_posts attach ON FIND_IN_SET(attach.ID, gallery_meta.meta_value)
          WHERE gallery_meta.post_id = p.ID 
          AND gallery_meta.meta_key = '_product_image_gallery'
          AND attach.post_type = 'attachment'
        ) as gallery_images
      FROM wp_posts p
      LEFT JOIN wp_postmeta pm ON p.ID = pm.post_id
      WHERE p.ID = ?
      GROUP BY p.ID
    `, [id]);

    if (!products.length) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const product = products[0];
    const metaObj = {};
    
    if (product.meta_data) {
      product.meta_data.split(',').forEach(meta => {
        const [key, value] = meta.split(':');
        if (key === '_regular_price') {
          metaObj.regular_price = value;
        } else if (key === '_sale_price') {
          metaObj.sale_price = value;
        }
      });
    }

    // Get product categories
    const [categories] = await connection.execute(`
      SELECT 
        t.term_id,
        t.name,
        t.slug
      FROM wp_terms t
      JOIN wp_term_taxonomy tt ON t.term_id = tt.term_id
      JOIN wp_term_relationships tr ON tt.term_taxonomy_id = tr.term_taxonomy_id
      WHERE tt.taxonomy = 'product_cat'
      AND tr.object_id = ?
    `, [id]);

    const formattedProduct = {
      id: product.ID,
      name: product.post_title,
      slug: product.post_name,
      description: product.post_content,
      short_description: product.post_excerpt,
      price: metaObj.sale_price || metaObj.regular_price,
      regular_price: metaObj.regular_price,
      sale_price: metaObj.sale_price,
      categories: categories.map(cat => ({
        id: cat.term_id,
        name: cat.name,
        slug: cat.slug
      })),
      images: [
        { src: product.thumbnail_url },
        ...(product.gallery_images ? 
          product.gallery_images.split(',')
            .filter(img => img.startsWith('gallery_image:'))
            .map(img => ({ src: img.split(':')[1] }))
          : []
        )
      ]
    };

    return NextResponse.json({
      success: true,
      product: formattedProduct
    }, {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error syncing product:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

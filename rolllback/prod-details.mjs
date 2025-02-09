import mysql from 'mysql2/promise';

// ============================================
// PLACE YOUR PRODUCT SLUG HERE
// const PRODUCT_SLUG = 'women-colorful-abstract-geometry-jumpsuit-cyberpunk-cosplay-bodysuit-steampunk-carnival-costume-halloween-party-zentai-suit';
// ============================================

const DB_CONFIG = {
  host: 'localhost',
  user: 'wpuser',
  password: 'way2mcnfch@WSX',
  database: 'woo_groovy'
};

export async function getProductBySlug(slug) {
  
  try {
    const connection = await mysql.createConnection(DB_CONFIG);
    await connection.execute('SET SESSION group_concat_max_len = 1000000');

    // Get base product information
    const [products] = await connection.execute(`
      SELECT 
        p.ID,
        p.post_title,
        p.post_content,
        p.post_excerpt,
        (SELECT meta_value FROM wp_postmeta WHERE post_id = p.ID AND meta_key = '_price' LIMIT 1) as base_price,
        (SELECT meta_value FROM wp_postmeta WHERE post_id = p.ID AND meta_key = '_stock_status' LIMIT 1) as stock_status,
        (SELECT meta_value FROM wp_postmeta WHERE post_id = p.ID AND meta_key = '_stock' LIMIT 1) as stock_quantity,
        (SELECT guid FROM wp_posts WHERE ID = (
          SELECT meta_value FROM wp_postmeta WHERE post_id = p.ID AND meta_key = '_thumbnail_id' LIMIT 1
        )) as main_image,
        (
          SELECT GROUP_CONCAT(
            DISTINCT posts.guid
            ORDER BY FIND_IN_SET(posts.ID, pm.meta_value)
          )
          FROM wp_postmeta pm
          JOIN wp_posts posts ON FIND_IN_SET(posts.ID, pm.meta_value)
          WHERE pm.post_id = p.ID 
          AND pm.meta_key = '_product_image_gallery'
          AND posts.post_type = 'attachment'
        ) as gallery_images
      FROM wp_posts p
      WHERE p.post_name = ?
      AND p.post_type = 'product'
      AND p.post_status = 'publish'
      LIMIT 1
    `, [slug]);

    if (!products.length) {
      throw new Error('Product not found');
    }

    const product = products[0];

    // Get variations
    const [variations] = await connection.execute(`
      SELECT 
        p.ID as id,
        p.post_name,
        (SELECT meta_value FROM wp_postmeta WHERE post_id = p.ID AND meta_key = '_price' LIMIT 1) as price,
        (SELECT meta_value FROM wp_postmeta WHERE post_id = p.ID AND meta_key = '_stock_status' LIMIT 1) as stock_status,
        (SELECT meta_value FROM wp_postmeta WHERE post_id = p.ID AND meta_key = '_stock' LIMIT 1) as stock_quantity,
        (SELECT meta_value FROM wp_postmeta WHERE post_id = p.ID AND meta_key = '_sku' LIMIT 1) as sku,
        (SELECT guid FROM wp_posts WHERE ID = (
          SELECT meta_value FROM wp_postmeta WHERE post_id = p.ID AND meta_key = '_thumbnail_id' LIMIT 1
        )) as image,
        GROUP_CONCAT(
          DISTINCT CONCAT(
            meta.meta_key, ':', meta.meta_value
          )
          ORDER BY meta.meta_key
        ) as attributes
      FROM wp_posts p
      LEFT JOIN wp_postmeta meta ON p.ID = meta.post_id
      WHERE p.post_parent = ?
      AND p.post_type = 'product_variation'
      AND meta.meta_key LIKE 'attribute_%'
      GROUP BY p.ID
    `, [product.ID]);

    // Get available attributes
    const [attributes] = await connection.execute(`
      SELECT 
        REPLACE(meta_key, 'attribute_', '') as attribute_name,
        GROUP_CONCAT(DISTINCT meta_value ORDER BY meta_value) as attribute_values
      FROM wp_postmeta
      WHERE post_id IN (
        SELECT ID 
        FROM wp_posts 
        WHERE post_parent = ? 
        AND post_type = 'product_variation'
      )
      AND meta_key LIKE 'attribute_%'
      AND meta_value != ''
      GROUP BY meta_key
    `, [product.ID]);

    // Get related products with enhanced information
    const [related] = await connection.execute(`
      SELECT DISTINCT 
        p.ID,
        p.post_title,
        p.post_name as slug,
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
          SELECT meta_value 
          FROM wp_postmeta 
          WHERE post_id = p.ID 
          AND meta_key = '_price' 
          LIMIT 1
        ) as price,
        COUNT(DISTINCT tr.term_taxonomy_id) as shared_terms
      FROM wp_posts p
      JOIN wp_term_relationships tr ON p.ID = tr.object_id
      JOIN wp_term_taxonomy tt ON tr.term_taxonomy_id = tt.term_taxonomy_id
      WHERE tt.term_id IN (
        SELECT tt.term_id
        FROM wp_term_relationships tr
        JOIN wp_term_taxonomy tt ON tr.term_taxonomy_id = tt.term_taxonomy_id
        WHERE tr.object_id = ?
      )
      AND p.ID != ?
      AND p.post_type = 'product'
      AND p.post_status = 'publish'
      GROUP BY p.ID, p.post_title, p.post_name
      ORDER BY shared_terms DESC, RAND()
      LIMIT 3
    `, [product.ID, product.ID]);

    // Format the data
    const cleanTitle = (title) => {
      return title
        .replace(/['"]/g, '') // Remove quotes
        .replace(/&amp;/g, '&') // Convert &amp; to &
        .replace(/&quot;/g, '') // Remove &quot;
        .replace(/&#8221;/g, '') // Remove right double quote
        .replace(/&#8220;/g, ''); // Remove left double quote
    };

    const formattedData = {
      product: {
        id: product.ID,
        title: cleanTitle(product.post_title),
        description: product.post_content,
        base_price: product.base_price,
        stock_status: product.stock_status,
        stock_quantity: product.stock_quantity,
        main_image: product.main_image,
        gallery_images: product.gallery_images ? product.gallery_images.split(',') : []
      },
      variations: variations.map(v => ({
        id: v.id,
        attributes: Object.fromEntries(
          (v.attributes || '').split(',')
            .map(attr => {
              const [key, value] = attr.split(':');
              return [key.replace('attribute_pa_', ''), value];
            })
        ),
        price: v.price,
        stock_status: v.stock_status,
        stock_quantity: v.stock_quantity,
        sku: v.sku,
        image: v.image
      })),
      available_attributes: Object.fromEntries(
        attributes.map(attr => [
          attr.attribute_name.replace('pa_', ''),
          attr.attribute_values.split(',')
        ])
      ),
      related_products: related.map(r => ({
        id: r.ID,
        title: cleanTitle(r.post_title),
        slug: r.slug,
        thumbnail_url: r.thumbnail_url,
        price: r.price
      }))
    };

    await connection.end();
    return formattedData;

  } catch (error) {
    console.error('Error fetching product:', error);
    return null;
  }
}

// Test execution
if (process.argv[2]) {
  getProductBySlug(process.argv[2])
    .then(data => {
      console.log(JSON.stringify(data, null, 2));
    })
    .catch(error => {
      console.error('Error:', error);
    })
    .finally(() => {
      process.exit(0);
    });
}

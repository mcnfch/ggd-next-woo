import mysql from 'mysql2/promise';
import fs from 'fs/promises';

// Database Configuration
const dbConfig = {
  host: 'localhost',
  user: 'wpuser',
  password: 'way2mcnfch@WSX',
  database: 'woo_groovy'
};

// Function to fetch a single product by slug
async function getProductBySlug(slug) {
  try {
    const connection = await mysql.createConnection(dbConfig);
    await connection.execute('SET SESSION group_concat_max_len = 1000000');

    // Fetch product details
    const [products] = await connection.execute(`
      SELECT 
        p.ID,
        p.post_title,
        p.post_name AS slug,
        p.post_content,
        (SELECT meta_value FROM wp_postmeta WHERE post_id = p.ID AND meta_key = '_price' LIMIT 1) AS base_price,
        (SELECT meta_value FROM wp_postmeta WHERE post_id = p.ID AND meta_key = '_sale_price' LIMIT 1) AS sale_price,
        (SELECT meta_value FROM wp_postmeta WHERE post_id = p.ID AND meta_key = '_sku' LIMIT 1) AS sku,
        (
          SELECT guid FROM wp_posts thumb
          JOIN wp_postmeta thumb_meta ON thumb_meta.meta_value = thumb.ID
          WHERE thumb_meta.post_id = p.ID 
          AND thumb_meta.meta_key = '_thumbnail_id'
          LIMIT 1
        ) AS thumbnail_url,
        (
          SELECT GROUP_CONCAT(attach.guid) 
          FROM wp_postmeta gallery_meta
          JOIN wp_posts attach ON FIND_IN_SET(attach.ID, gallery_meta.meta_value)
          WHERE gallery_meta.post_id = p.ID 
          AND gallery_meta.meta_key = '_product_image_gallery'
        ) AS gallery_images
      FROM wp_posts p
      WHERE p.post_type = 'product'
        AND p.post_status = 'publish'
        AND p.post_name = ?
      LIMIT 1;
    `, [slug]);

    if (products.length === 0) {
      console.log(`No product found for slug: ${slug}`);
      return null;
    }

    const product = products[0];

    // Fetch related products using WooCommerce transients with fallback to category-based related products
    const [relatedProducts] = await connection.execute(`
      SELECT GROUP_CONCAT(CONCAT(p.ID, ':', p.post_name)) AS related_products
      FROM wp_posts p
      WHERE p.ID IN (
        -- WooCommerce transient-based related products
        SELECT CAST(SUBSTRING_INDEX(SUBSTRING_INDEX(SUBSTRING_INDEX(option_value, 'i:0;s:', -1), '"', 1), '"', 1) AS UNSIGNED)
        FROM wp_options WHERE option_name = CONCAT('_transient_wc_related_', ?) AND option_value NOT LIKE '%a:0:{}%'
        
        UNION ALL
        
        -- Category-based fallback if transient is empty
        SELECT tr.object_id FROM wp_term_relationships tr
        JOIN wp_term_relationships tr2 ON tr.term_taxonomy_id = tr2.term_taxonomy_id
        WHERE tr2.object_id = ? AND tr.object_id != ?
      );
    `, [product.ID, product.ID, product.ID]);

    // Process related products
    const processRelatedProducts = (relatedString) => {
      if (!relatedString) return [];
      return relatedString.split(',').map(item => {
        const [id, slug] = item.split(':');
        return { id: id.trim(), slug: slug.trim() };
      });
    };

    // Build final product structure
    const productData = {
      product: {
        id: product.ID.toString(),
        sku: product.sku || "",
        name: product.post_title || "",
        slug: product.slug || "",
        description: product.post_content || "",
        base_price: parseFloat(product.base_price) || 0,
        sale_price: parseFloat(product.sale_price) || 0,
        thumbnail_url: product.thumbnail_url || null,
        gallery_images: product.gallery_images ? product.gallery_images.split(',') : [],
        related_products: processRelatedProducts(relatedProducts[0]?.related_products || "")
      }
    };

    // Write output to JSON file
    await fs.writeFile('single_product.json', JSON.stringify(productData, null, 2));
    console.log(`Product data saved to single_product.json`);

    // Close connection
    await connection.end();

    return productData;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

// Execute the function with a given slug
const productSlug = "surf-sacred-geometry-rave-board-shorts"; // Change this slug as needed
getProductBySlug(productSlug).catch(console.error);

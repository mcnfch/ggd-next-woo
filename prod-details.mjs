import mysql from 'mysql2/promise';

const DB_CONFIG = {
  host: 'localhost',
  user: 'wpuser',
  password: 'way2mcnfch@WSX',
  database: 'woo_groovy',
  charset: 'utf8'
};

async function fetchRelatedProducts(productId) {
  const query = `
    query GetProductWithRelated {
      product(id: "${productId}", idType: DATABASE_ID) {
        related {
          nodes {
            id
            name
            slug
            image {
              sourceUrl
              altText
            }
          }
        }
      }
    }
  `;

  try {
    const response = await fetch('https://woo.groovygallerydesigns.com/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    });

    const data = await response.json();
    console.log('GraphQL Response:', data); // Debug log
    return data?.data?.product?.related?.nodes || [];
  } catch (error) {
    console.error('Error fetching related products:', error);
    return [];
  }
}

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
      console.error('No product found with slug:', slug);
      return { product: null, variations: [], available_attributes: [], related_products: [] };
    }

    const product = products[0];

    // Get variations
    const [variations] = await connection.execute(`
      SELECT 
        p.ID as variation_id,
        p.post_title,
        (SELECT meta_value FROM wp_postmeta WHERE post_id = p.ID AND meta_key = '_price' LIMIT 1) as price,
        (SELECT meta_value FROM wp_postmeta WHERE post_id = p.ID AND meta_key = '_stock_status' LIMIT 1) as stock_status,
        (SELECT meta_value FROM wp_postmeta WHERE post_id = p.ID AND meta_key = '_stock' LIMIT 1) as stock_quantity,
        (SELECT guid FROM wp_posts WHERE ID = (
          SELECT meta_value FROM wp_postmeta WHERE post_id = p.ID AND meta_key = '_thumbnail_id' LIMIT 1
        )) as image,
        GROUP_CONCAT(
          CONCAT(
            meta.meta_key,
            '::',
            meta.meta_value
          )
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
        meta_key,
        meta_value
      FROM wp_postmeta
      WHERE post_id = ?
      AND meta_key LIKE 'attribute_%'
    `, [product.ID]);

    const available_attributes = {};
    attributes.forEach(attr => {
      const name = attr.meta_key.replace('attribute_', '');
      const values = attr.meta_value.split('|').map(v => v.trim()).filter(Boolean);
      if (values.length > 0) {
        available_attributes[name] = values;
      }
    });

    // Process variations
    const processedVariations = variations.map(variation => {
      const attrs = {};
      variation.attributes.split(',').forEach(attr => {
        const [key, value] = attr.split('::');
        attrs[key.replace('attribute_', '')] = value;
      });
      
      return {
        id: variation.variation_id,
        price: variation.price,
        stock_status: variation.stock_status,
        stock_quantity: variation.stock_quantity,
        image: variation.image,
        attributes: attrs
      };
    });

    // Get product ID for GraphQL query
    const [productId] = await connection.execute(`
      SELECT ID FROM wp_posts WHERE post_name = ? AND post_type = 'product' LIMIT 1
    `, [slug]);

    // Fetch related products using GraphQL
    const related_products = productId[0]?.ID ? await fetchRelatedProducts(productId[0].ID) : [];

    await connection.end();

    return {
      product: {
        id: product.ID,
        name: product.post_title,
        description: product.post_content,
        excerpt: product.post_excerpt,
        price: product.base_price,
        stock_status: product.stock_status,
        stock_quantity: product.stock_quantity,
        main_image: product.main_image,
        gallery_images: product.gallery_images ? product.gallery_images.split(',') : []
      },
      variations: processedVariations,
      available_attributes,
      related_products
    };

  } catch (error) {
    console.error('Error in getProductBySlug:', error);
    return { product: null, variations: [], available_attributes: [], related_products: [] };
  }
}

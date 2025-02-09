import mysql from 'mysql2/promise';

const dbConfig = {
  host: 'localhost',
  user: 'wpuser',
  password: 'way2mcnfch@WSX',
  database: 'woo_groovy'
};

export async function getProductVariations(productId) {
  try {
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
    `, [productId]);

    // Process meta data
    return variations.map(variation => {
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
  } catch (error) {
    console.error('Error fetching variations:', error);
    return [];
  }
}

export async function getProductVariation(productId, variationId) {
  try {
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
      AND p.ID = ?
      GROUP BY p.ID
    `, [productId, variationId]);

    if (!variations.length) {
      return null;
    }

    const variation = variations[0];
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
  } catch (error) {
    console.error('Error fetching variation:', error);
    return null;
  }
}

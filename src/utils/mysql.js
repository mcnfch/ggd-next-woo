import mysql from 'mysql2/promise';

// Database configuration
const dbConfig = {
  host: 'localhost',
  user: 'wpuser',
  password: 'way2mcnfch@WSX',
  database: 'woo_groovy'
};

export async function getProductBySlug(slug) {
  try {
    const connection = await mysql.createConnection(dbConfig);
    await connection.execute('SET SESSION group_concat_max_len = 1000000');

    // Get the product by its slug
    const [products] = await connection.execute(`
      SELECT 
        p.*,
        GROUP_CONCAT(
          DISTINCT CONCAT(pm.meta_key, ':', pm.meta_value)
          ORDER BY pm.meta_key
        ) as meta_data,
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
        ) as gallery_images,
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
            DISTINCT CONCAT(rp.ID, ':', rp.post_name)
            ORDER BY rp.ID
          )
          FROM (
            SELECT rp.ID, rp.post_name
            FROM wp_options opt
            JOIN wp_posts rp ON rp.post_type = 'product' 
              AND rp.post_status = 'publish'
              AND rp.ID IN (
                SELECT CAST(id AS UNSIGNED) FROM (
                  SELECT SUBSTRING_INDEX(SUBSTRING_INDEX(SUBSTRING_INDEX(option_value, 'i:0;s:4:"', -1), '"', 1), '"', 1) as id
                  FROM wp_options
                  WHERE option_name = CONCAT('_transient_wc_related_', p.ID)
                  AND option_value NOT LIKE '%a:0:{}%'
                  AND option_value REGEXP 'i:0;s:4:"[0-9]+'
                  UNION ALL
                  SELECT SUBSTRING_INDEX(SUBSTRING_INDEX(SUBSTRING_INDEX(option_value, 'i:1;s:4:"', -1), '"', 1), '"', 1) as id
                  FROM wp_options
                  WHERE option_name = CONCAT('_transient_wc_related_', p.ID)
                  AND option_value NOT LIKE '%a:0:{}%'
                  AND option_value REGEXP 'i:1;s:4:"[0-9]+'
                  UNION ALL
                  SELECT SUBSTRING_INDEX(SUBSTRING_INDEX(SUBSTRING_INDEX(option_value, 'i:2;s:4:"', -1), '"', 1), '"', 1) as id
                  FROM wp_options
                  WHERE option_name = CONCAT('_transient_wc_related_', p.ID)
                  AND option_value NOT LIKE '%a:0:{}%'
                  AND option_value REGEXP 'i:2;s:4:"[0-9]+'
                  UNION ALL
                  SELECT SUBSTRING_INDEX(SUBSTRING_INDEX(SUBSTRING_INDEX(option_value, 'i:3;s:4:"', -1), '"', 1), '"', 1) as id
                  FROM wp_options
                  WHERE option_name = CONCAT('_transient_wc_related_', p.ID)
                  AND option_value NOT LIKE '%a:0:{}%'
                  AND option_value REGEXP 'i:3;s:4:"[0-9]+'
                  UNION ALL
                  SELECT SUBSTRING_INDEX(SUBSTRING_INDEX(SUBSTRING_INDEX(option_value, 'i:4;s:4:"', -1), '"', 1), '"', 1) as id
                  FROM wp_options
                  WHERE option_name = CONCAT('_transient_wc_related_', p.ID)
                  AND option_value NOT LIKE '%a:0:{}%'
                  AND option_value REGEXP 'i:4;s:4:"[0-9]+'
                ) ids
                WHERE id != '' AND id REGEXP '^[0-9]+$'
              )
            WHERE opt.option_name = CONCAT('_transient_wc_related_', p.ID)
            LIMIT 5
          ) rp
        ) as related_products,
        (
          SELECT GROUP_CONCAT(
            DISTINCT CONCAT(up.ID, ':', up.post_name)
          )
          FROM wp_postmeta upm
          JOIN wp_posts up ON up.ID IN (
            SELECT SUBSTRING_INDEX(SUBSTRING_INDEX(SUBSTRING(upm2.meta_value, LOCATE('i:', upm2.meta_value) + 2), ';', 1), ':', -1)
            FROM wp_postmeta upm2
            WHERE upm2.post_id = p.ID
            AND upm2.meta_key = '_upsell_ids'
            AND upm2.meta_value != 'a:0:{}'
          )
          WHERE upm.post_id = p.ID
          AND upm.meta_key = '_upsell_ids'
          AND up.post_status = 'publish'
        ) as upsell_products,
        (
          SELECT GROUP_CONCAT(
            DISTINCT CONCAT(cp.ID, ':', cp.post_name)
          )
          FROM wp_postmeta cpm
          JOIN wp_posts cp ON cp.ID IN (
            SELECT SUBSTRING_INDEX(SUBSTRING_INDEX(SUBSTRING(cpm2.meta_value, LOCATE('i:', cpm2.meta_value) + 2), ';', 1), ':', -1)
            FROM wp_postmeta cpm2
            WHERE cpm2.post_id = p.ID
            AND cpm2.meta_key = '_crosssell_ids'
            AND cpm2.meta_value != 'a:0:{}'
          )
          WHERE cpm.post_id = p.ID
          AND cpm.meta_key = '_crosssell_ids'
          AND cp.post_status = 'publish'
        ) as crosssell_products
      FROM wp_posts p
      LEFT JOIN wp_postmeta pm ON p.ID = pm.post_id
      WHERE p.post_type = 'product'
      AND p.post_status = 'publish'
      AND p.post_name = ?
      GROUP BY p.ID, p.post_author, p.post_date, p.post_date_gmt, p.post_content,
               p.post_title, p.post_excerpt, p.post_status, p.comment_status,
               p.ping_status, p.post_password, p.post_name, p.to_ping, p.pinged,
               p.post_modified, p.post_modified_gmt, p.post_content_filtered,
               p.post_parent, p.guid, p.menu_order, p.post_type, p.post_mime_type,
               p.comment_count
    `, [slug]);

    if (products.length === 0) {
      return { product: null };
    }

    const product = products[0];

    // Get variations for this product
    const [variations] = await connection.execute(`
      SELECT 
        v.*,
        v.post_parent as product_id,
        GROUP_CONCAT(
          DISTINCT CONCAT(vm.meta_key, ':', vm.meta_value)
          ORDER BY vm.meta_key
        ) as meta_data,
        (
          SELECT guid
          FROM wp_posts var_thumb
          JOIN wp_postmeta var_thumb_meta ON var_thumb_meta.meta_value = var_thumb.ID
          WHERE var_thumb_meta.post_id = v.ID 
          AND var_thumb_meta.meta_key = '_thumbnail_id'
          AND var_thumb.post_type = 'attachment'
          LIMIT 1
        ) as variation_image,
        (
          SELECT GROUP_CONCAT(
            DISTINCT CONCAT(
              attr.meta_key, ':', attr.meta_value
            )
          )
          FROM wp_postmeta attr
          WHERE attr.post_id = v.ID
          AND attr.meta_key LIKE 'attribute_%'
        ) as variation_attributes
      FROM wp_posts v
      LEFT JOIN wp_postmeta vm ON v.ID = vm.post_id
      WHERE v.post_type = 'product_variation'
      AND v.post_parent = ?
      GROUP BY v.ID
    `, [product.ID]);

    // Process meta data
    const productMeta = {};
    if (product.meta_data) {
      product.meta_data.split(',').forEach(pair => {
        const [key, value] = pair.split(':');
        if (key && value) {
          productMeta[key] = value;
        }
      });
    }

    // Process variations
    const processedVariations = variations.map(v => {
      const meta = {};
      if (v.meta_data) {
        v.meta_data.split(',').forEach(pair => {
          const [key, value] = pair.split(':');
          if (key && value) {
            meta[key] = value;
          }
        });
      }

      const attributes = {};
      if (v.variation_attributes) {
        v.variation_attributes.split(',').forEach(pair => {
          const [key, value] = pair.split(':');
          if (key && value) {
            attributes[key] = value;
          }
        });
      }

      return {
        ...v,
        meta,
        attributes,
        image_url: v.variation_image || null
      };
    });

    // Process gallery images
    const galleryImages = product.gallery_images ? product.gallery_images.split(',') : [];

    // Process related, upsell, and crosssell products
    const relatedProducts = product.related_products ? product.related_products.split(',') : [];
    const upsellProducts = product.upsell_products ? product.upsell_products.split(',') : [];
    const crosssellProducts = product.crosssell_products ? product.crosssell_products.split(',') : [];

    // Close the connection
    await connection.end();

    return {
      product: {
        ...product,
        meta: productMeta,
        variations: processedVariations,
        gallery_images: galleryImages,
        related_products: relatedProducts,
        upsell_products: upsellProducts,
        crosssell_products: crosssellProducts,
        type: productMeta._downloadable === 'yes' ? 'downloadable' : 
              processedVariations.length > 0 ? 'variable' : 'simple'
      }
    };
  } catch (error) {
    console.error('Error fetching product:', error);
    throw error;
  }
}

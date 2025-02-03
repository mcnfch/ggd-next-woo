import mysql from 'mysql2/promise';

export async function getConnection() {
  return await mysql.createConnection({
    host: 'localhost',
    user: 'wpuser',
    password: 'way2mcnfch@WSX',
    database: 'woo_groovy'
  });
}

export async function getCategoryProducts(categoryPath) {
  const connection = await getConnection();
  try {
    // First get the category ID from the path
    const [categories] = await connection.execute(`
      WITH RECURSIVE CategoryPath AS (
        -- Base case: categories with no parent
        SELECT 
          t.term_id,
          t.name,
          t.slug,
          tt.parent,
          CAST(t.slug AS CHAR(1000)) AS path
        FROM wp_terms t
        JOIN wp_term_taxonomy tt ON t.term_id = tt.term_id
        WHERE tt.taxonomy = 'product_cat'
        AND tt.parent = 0

        UNION ALL

        -- Recursive case: categories with parents
        SELECT 
          t.term_id,
          t.name,
          t.slug,
          tt.parent,
          CONCAT(cp.path, '/', t.slug)
        FROM wp_terms t
        JOIN wp_term_taxonomy tt ON t.term_id = tt.term_id
        JOIN CategoryPath cp ON tt.parent = cp.term_id
        WHERE tt.taxonomy = 'product_cat'
      )
      SELECT term_id, name, slug
      FROM CategoryPath
      WHERE path = ?
    `, [categoryPath]);

    if (!categories.length) {
      return { products: [], category: null };
    }

    const category = categories[0];

    // Get all products with their images in a single query
    const [products] = await connection.execute(`
      SELECT DISTINCT
        p.ID as id,
        p.post_title as name,
        p.post_name as slug,
        p.post_content as description,
        p.post_date as date_created,
        MAX(CASE WHEN pm_price.meta_key = '_regular_price' THEN pm_price.meta_value END) as price,
        MAX(CASE WHEN pm_stock.meta_key = '_stock_status' THEN pm_stock.meta_value END) as stock_status,
        (
          SELECT 
            CASE 
              WHEN post_meta.meta_value LIKE 'https://%' THEN post_meta.meta_value
              ELSE COALESCE(NULLIF(post_meta.meta_value, ''), wp_posts.guid)
            END
          FROM wp_posts
          LEFT JOIN wp_postmeta post_meta 
            ON post_meta.post_id = wp_posts.ID 
            AND post_meta.meta_key = '_wp_attached_file'
          WHERE wp_posts.ID = (
            SELECT meta_value 
            FROM wp_postmeta 
            WHERE post_id = p.ID 
            AND meta_key = '_thumbnail_id'
            LIMIT 1
          )
          LIMIT 1
        ) as thumbnail_url,
        GROUP_CONCAT(DISTINCT 
          CASE WHEN tt.taxonomy = 'product_cat' THEN
            CONCAT(
              t.name, ':', 
              t.slug, ':',
              t.term_id
            )
          END
        ) as categories
      FROM wp_posts p
      JOIN wp_term_relationships tr ON p.ID = tr.object_id
      JOIN wp_term_taxonomy tt ON tr.term_taxonomy_id = tt.term_taxonomy_id
      JOIN wp_terms t ON tt.term_id = t.term_id
      LEFT JOIN wp_postmeta pm_price ON p.ID = pm_price.post_id AND pm_price.meta_key = '_regular_price'
      LEFT JOIN wp_postmeta pm_stock ON p.ID = pm_stock.post_id AND pm_stock.meta_key = '_stock_status'
      WHERE tt.term_id = ?
      AND p.post_type = 'product'
      AND p.post_status = 'publish'
      GROUP BY p.ID, p.post_title, p.post_name, p.post_content, p.post_date
    `, [category.term_id]);

    // Format products with their images
    const formattedProducts = products.map(product => ({
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description,
      price: product.price || "0.00",
      stock_status: product.stock_status || "instock",
      categories: product.categories ? product.categories.split(',').map(cat => {
        const [name, slug, id] = cat.split(':');
        return { name, slug, id: parseInt(id, 10) };
      }) : [],
      images: product.thumbnail_url ? [{
        src: product.thumbnail_url,
        alt: product.name,
        position: 0
      }] : []
    }));

    return {
      products: formattedProducts,
      category: {
        term_id: category.term_id,
        name: category.name,
        slug: category.slug
      }
    };

  } finally {
    await connection.end();
  }
}

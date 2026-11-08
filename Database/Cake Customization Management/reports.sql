-- 10. Verify the tables and joined cake data
SHOW TABLES;

SELECT * FROM categories ORDER BY id;
SELECT * FROM flavors ORDER BY id;
SELECT * FROM sizes ORDER BY id;
SELECT * FROM design_specs ORDER BY id;

SELECT
    cd.id,
    cd.title,
    cd.base_price,
    c.name AS category,
    f.name AS flavor,
    s.name AS size,
    ds.color,
    ds.texture,
    ds.shapes,
    ds.icing,
    cd.imageUrl,
    cd.createdAt
FROM cake_designs AS cd
JOIN categories AS c ON cd.category_id = c.id
JOIN flavors AS f ON cd.flavor_id = f.id
JOIN sizes AS s ON cd.size_id = s.id
JOIN design_specs AS ds ON cd.spec_id = ds.id
ORDER BY cd.id;

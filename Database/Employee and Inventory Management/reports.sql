-- =========================================================
-- REPORT 1: EMPLOYEE, INVENTORY, AND SUPPLIER
-- LEFT JOIN
-- Shows employees, their assigned inventory, and suppliers.
-- Includes employees even if they have no assigned inventory.
-- =========================================================

SELECT
    e.employee_id,
    e.name AS employee_name,
    e.role,
    i.inventory_id,
    i.item_name AS ingredient_name,
    i.quantity AS available_quantity,
    i.unit,
    s.supplier_name

FROM employee e
LEFT JOIN inventory i
    ON e.employee_id = i.employee_id
LEFT JOIN supplier s
    ON i.supplier_id = s.supplier_id

ORDER BY e.employee_id;


-- =========================================================
-- REPORT 2: INGREDIENTS, INVENTORY, AND CAKE DESIGNS
-- LEFT JOIN
-- Shows cake designs and their required ingredients,
-- including their available inventory.
-- =========================================================

SELECT
    cd.id AS design_id,
    cd.title AS cake_design,
    cdi.id AS ingredient_record_id,
    i.inventory_id,
    i.item_name AS ingredient_name,
    cdi.quantity_required,
    i.quantity AS available_quantity,
    i.unit,
    i.reorder_level

FROM cake_designs cd
LEFT JOIN cake_design_ingredient cdi
    ON cd.id = cdi.design_id
LEFT JOIN inventory i
    ON cdi.inventory_id = i.inventory_id

ORDER BY cd.id;


-- =========================================================
-- REPORT 3: EMPLOYEE, INVENTORY, AND INVENTORY USAGE
-- LEFT JOIN
-- Shows employees, their managed inventory, and the
-- recorded usage of each inventory item.
-- =========================================================

SELECT
    e.employee_id,
    e.name AS employee_name,
    e.role,
    i.inventory_id,
    i.item_name AS ingredient_name,
    i.quantity AS available_quantity,
    iu.usage_id,
    iu.quantity_used,
    iu.used_at

FROM employee e
LEFT JOIN inventory i
    ON e.employee_id = i.employee_id
LEFT JOIN inventory_usage iu
    ON i.inventory_id = iu.inventory_id

ORDER BY e.employee_id;

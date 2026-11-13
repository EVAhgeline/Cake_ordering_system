-- =========================================================
-- REPORT 1: SUPPLIERS AND PURCHASE ORDERS
-- FULL OUTER JOIN EQUIVALENT USING UNION
-- Shows all suppliers and purchase orders, including
-- suppliers without purchase orders and unmatched orders.
-- =========================================================

SELECT
    s.supplier_id,
    s.supplier_name,
    po.purchase_order_id,
    po.order_date,
    po.expected_delivery_date,
    po.status AS purchase_order_status,
    po.total_amount

FROM supplier s
LEFT JOIN purchase_order po
    ON s.supplier_id = po.supplier_id

UNION

SELECT
    s.supplier_id,
    s.supplier_name,
    po.purchase_order_id,
    po.order_date,
    po.expected_delivery_date,
    po.status AS purchase_order_status,
    po.total_amount

FROM supplier s
RIGHT JOIN purchase_order po
    ON s.supplier_id = po.supplier_id;


-- =========================================================
-- REPORT 2: SUPPLIERS, PURCHASE ORDERS, AND EMPLOYEES
-- LEFT JOIN
-- Shows suppliers, their purchase orders, and the employees
-- responsible for processing those orders.
-- =========================================================

SELECT
    s.supplier_id,
    s.supplier_name,
    po.purchase_order_id,
    po.order_date,
    po.status AS purchase_order_status,
    po.total_amount,
    e.employee_id,
    e.name AS employee_name,
    e.role AS employee_role

FROM supplier s
LEFT JOIN purchase_order po
    ON s.supplier_id = po.supplier_id
LEFT JOIN employee e
    ON po.employee_id = e.employee_id

ORDER BY s.supplier_id;

-- =========================================================
-- REPORT 3: PURCHASE ORDERS, PURCHASE ORDER DETAILS,
-- AND INVENTORY
-- LEFT JOIN
-- Shows purchase orders, the inventory items ordered,
-- quantities, prices, and calculated subtotals.
-- =========================================================

SELECT
    po.purchase_order_id,
    po.order_date,
    po.status AS purchase_order_status,
    pod.purchase_order_detail_id,
    i.inventory_id,
    i.item_name AS inventory_item,
    pod.quantity AS quantity_ordered,
    i.unit,
    pod.unit_price,
    pod.subtotal

FROM purchase_order po
LEFT JOIN purchase_order_detail pod
    ON po.purchase_order_id = pod.purchase_order_id
LEFT JOIN inventory i
    ON pod.inventory_id = i.inventory_id

ORDER BY po.purchase_order_id;



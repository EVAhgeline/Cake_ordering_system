-- =========================================================
-- REPORT 1: CUSTOMER, ORDERS, AND PAYMENTS
-- INNER JOIN
-- Shows customer names, order details, and payment information.
-- =========================================================

SELECT
    c.name AS customer_name,
    o.order_id,
    o.order_date,
    o.status,
    p.method AS payment_method,
    p.total_amount

FROM customer c
INNER JOIN custom_order o
    ON c.customer_id = o.customer_id
INNER JOIN payment p
    ON o.order_id = p.order_id;


-- =========================================================
-- REPORT 2: CUSTOMER ORDER AND CAKE DETAILS
-- INNER JOIN
-- Shows customers, their orders, and the cake designs they ordered.
-- =========================================================

SELECT
    c.name AS customer_name,
    o.order_id,
    cd.title AS cake_design,
    od.quantity,
    od.message_on_cake

FROM customer c
INNER JOIN custom_order o
    ON c.customer_id = o.customer_id
INNER JOIN order_detail od
    ON o.order_id = od.order_id
INNER JOIN cake_designs cd
    ON od.design_id = cd.id;


-- =========================================================
-- REPORT 3: COMPLETE CUSTOMER ORDER AND PAYMENT DETAILS
-- INNER JOIN
-- Shows customer information, cake details, flavors, sizes, and payments.
-- =========================================================

SELECT
    c.name AS customer_name,
    o.order_id,
    cd.title AS cake_design,
    f.name AS flavor,
    s.name AS size,
    od.quantity,
    p.method AS payment_method,
    p.total_amount

FROM customer c
INNER JOIN custom_order o
    ON c.customer_id = o.customer_id
INNER JOIN order_detail od
    ON o.order_id = od.order_id
INNER JOIN cake_designs cd
    ON od.design_id = cd.id
INNER JOIN flavors f
    ON od.flavor_id = f.id
INNER JOIN sizes s
    ON od.size_id = s.id
INNER JOIN payment p
    ON o.order_id = p.order_id;
    
    
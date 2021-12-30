const defaults = {
    cartModal: '.cart-sidebar', // classname
    cartModalContent: '.cart-items-wrapper', // classname
    cartModalClose: '.cart-sidebar__toggler', // classname
    cartDrawer: '.cart-sidebar', // classname
    cartDrawerContent: '.cart-items-wrapper', // classname
    cartDrawerClose: '.cart-sidebar__toggler', // classname
    cartDrawerTrigger: '.cart-sidebar__toggler', // classname
    cartOverlay: '.cart-sidebar__overlay', // classname
    cartCounter: '.cart-count', // classname
    addToCart: '.js-ajax-add-to-cart', // classname
    removeFromCart: '.js-ajax-remove-from-cart', //classname
    removeFromCartNoDot: 'js-ajax-remove-from-cart', //classname,
    checkoutButton: '.js-ajax-checkout-button',
    cartTotal: '.js-ajax-cart-total',
    upsellProducts: '.upsell-slider .carousel-cell'
};

const cartModal = document.querySelector(defaults.cartModal);
const cartModalContent = document.querySelector(defaults.cartModalContent);
const cartModalClose = document.querySelector(defaults.cartModalClose);
const cartDrawer = document.querySelector(defaults.cartDrawer);
const cartDrawerContent = document.querySelector(defaults.cartDrawerContent);
const cartDrawerClose = document.querySelector(defaults.cartDrawerClose);
const cartDrawerTrigger = document.querySelector(defaults.cartDrawerTrigger);
const cartOverlay = document.querySelector(defaults.cartOverlay);
const cartCounter = document.querySelector(defaults.cartCounter);
const addToCart = document.querySelectorAll(defaults.addToCart);
let removeFromCart = document.querySelectorAll(defaults.removeFromCart);
const checkoutButton = document.querySelector(defaults.checkoutButton);
const cartTotal = document.querySelector(defaults.cartTotal);
const htmlSelector = document.documentElement;
const upsell_products = document.querySelectorAll(defaults.upsellProducts);



for (let i = 0; i < addToCart.length; i++) {

    addToCart[i].addEventListener('click', function (event) {

        event.preventDefault();
        const formID = this.parentNode.getAttribute('id');
        console.log(formID);

        addProductToCart(formID);

    });

}

function addProductToCart(formID) {
    $.ajax({
        type: 'POST',
        url: '/cart/add.js',
        dataType: 'json',
        data: $('#' + formID)
            .serialize(),
        success: addToCartOk,
        error: addToCartFail,
    });
}

function fetchCart() {
    $.ajax({
        type: 'GET',
        url: '/cart.js',
        dataType: 'json',
        success: function (cart) {
            // console.log(cart);
            onCartUpdate(cart);

            if (cart.item_count === 0) {
                cartDrawerContent.innerHTML = 'Cart is empty';
                cartCounter.innerHTML = '0';
                checkoutButton.classList.add('disabled');
                cartTotal.innerHTML = Shopify.formatMoney(cart.total_price);
            } else {
                renderCart(cart);
                checkoutButton.classList.remove("disabled");
            }

        },
    });
}

function changeItem(line, callback) {
    const quantity = 0;
    $.ajax({
        type: 'POST',
        url: '/cart/change.js',
        data: 'quantity=' + quantity + '&line=' + line,
        dataType: 'json',
        success: function (cart) {
            if ((typeof callback) === 'function') {
                callback(cart);
            } else {
                onCartUpdate(cart);
                fetchCart();
                // removeProductFromCart();
                showUpsellItem(cart);
            }
        },
        error: function (xhr, status, error) {
            var err = eval("(" + xhr.responseText + ")");
            console.log(err.Message);
        }
    });
}

function onCartUpdate(cart) {
    console.log('items in the cart?', cart.item_count);
    cartCounter.innerHTML = cart.item_count;
}

function addToCartOk(product) {
    cartModalContent.innerHTML = product.title + ' was added to the cart!';
    cartCounter.innerHTML = Number(cartCounter.innerHTML) + 1;
    openAddModal();
    openCartOverlay();
    fetchCart();
}

function removeProductFromCart() {
    console.log('item remooved');
    // cartCounter.innerHTML = Number(cartCounter.innerHTML) - 1;

}

function addToCartFail() {
    cartModalContent.innerHTML = 'The product you are trying to add is out of stock.';
    openAddModal();
    openCartOverlay();
}

function renderCart(cart) {
    // console.log(selected_options);
    console.log(cart);

    clearCartDrawer();

    cart.items.forEach(function (item, index) {

        // console.log(item);`
        //console.log(item.title);
        //console.log(item.image);`
        //console.log(item.line_price);
        //console.log(item.quantity);
        let title = (item.title).split('-');
        const item_title = title[0];
        const properties = item.properties;
        const variant_options = item.options_with_values;
        var product_options = '';
        let old_price, regular_price, sale_price = '';
        for (var p in properties) {
            product_options = product_options + '<p>' + p + ':' + properties[p] + '</p>';
        }
        if (variant_options.length > 0) {
            for (var option in variant_options) {
                if (variant_options[option].value == "Default Title") {} else {
                    product_options = product_options + '<p>' + variant_options[option].value + '</p>';
                }
            }
        }
        if (item.original_line_price != item.final_line_price) {
            old_price = '<span class="old-price">' + Shopify.formatMoney(item.original_line_price) + '</span>';
            sale_price = '<span class="sale-price"><del>' + Shopify.formatMoney(item.final_line_price) + '</del></span>';
        } else {
            regular_price = '<span class="regular-price">' + Shopify.formatMoney(item.original_line_price) + '</span>';
        }

        let item_inventory = variants[item.id];
        if (item_inventory == "" || typeof (item_inventory) == "undefined") {
            item_inventory = 1000;
        }
        let image_wrapper = '<div class="cart-item__thumbnail"><div class="image-ratio image-ratio--square"><img src=' + item.image + ' alt=""></div></div>';
        let item_meta = '<div class="cart-item__meta"><div class="cart-item__meta--header d-flex justify-content-between"><div class="title-block mb-0"><h6>' + item_title + '</h6>' + product_options + '</div><button class="btn btn-reset btn-remove-item js-ajax-remove-from-cart text-underline p-0">REMOVE</button></div>';
        let quantity_wrapper = '<div class="cart-item__meta__footer"><div class="cart-item-quantity"><div class="input-group"><button type="button" class="btn btn-number-cart-darwer btn-number" data-type="minus" data-field="updates[]"><span class="btn-action-minus"><svg width="10" height="2" viewBox="0 0 13 2" fill="none"xmlns="http://www.w3.org/2000/svg"><line x1="13" y1="0.625" x2="5.46392e-08" y2="0.625001" stroke="currentColor" stroke-width="1.25" /></svg></span></button><input type="text" name="updates[]" class="input-number" value="' + item.quantity + '" min="1" max="' + item_inventory + '"><button type="button" class="btn btn-number-cart-darwer btn-number" data-type="plus" data-field="updates[]"> <span class="btn-action-plus"><svg width="10" height="10" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6.6 0.875H6.475V1V6.475H1H0.875V6.6V7.4V7.525H1H6.475V13V13.125H6.6H7.4H7.525V13V7.525H13H13.125V7.4V6.6V6.475H13H7.525V1V0.875H7.4H6.6Z" fill="currentColor" stroke="currentColor" stroke-width="0.25" /></svg></span></button></div></div><p class="cart-item__price">' + regular_price + '</p></div></div>';
        let cart_item = '<div class="cart-item" data-line="' + Number(index + 1) + '">' + image_wrapper + item_meta + quantity_wrapper + '</div>';

        cartDrawerContent.innerHTML = cartDrawerContent.innerHTML + cart_item;
        let cartUpsellSlider = upsell_products[0].closest('.carouselInit');
        var flkty = new Flickity(cartUpsellSlider);
        for (let index = 0; index < upsell_products.length; index++) {
            const element = upsell_products[index];
            let data_id = element.dataset.p_id;
            if (item.product_id == data_id) {
                console.log(item.product_id);
                element.classList.add('d-none');
                flkty.resize();
                break;
            }
        }

    });
    cartTotal.innerHTML = Shopify.formatMoney(cart.total_price);
    // document.querySelectorAll('.js-ajax-remove-from-cart')
    //     .forEach((element) => {
    //         element.addEventListener('click', function() {
    //             const lineID = this.parentNode.getAttribute('data-line');
    //             console.log('aa');
    //         });
    //     });

    removeFromCart = document.querySelectorAll(defaults.removeFromCart);
    qtyUpdater = document.querySelectorAll('.btn-number-cart-darwer');
    for (let i = 0; i < removeFromCart.length; i++) {
        removeFromCart[i].addEventListener('click', function () {
            const line = this.closest('.cart-item').getAttribute('data-line');
            // console.log(line);
            changeItem(line);

        });
    }
    for (let i = 0; i < qtyUpdater.length; i++) {
        qtyUpdater[i].addEventListener('click', function (e) {
            e.preventDefault();
            var qty_btn = $(this);

            sideCartItemInput(qty_btn);

            // console.log(line, quantity);
            const line = $(this).parents(".cart-item").attr('data-line');
            var quantity = 0;
            const btn_type = this.getAttribute('data-type');
            if (btn_type == 'plus') {
                quantity = parseInt(this.previousSibling.value);
            } else {
                quantity = parseInt(this.nextSibling.value);
            }
            // console.log(line, quantity);
            updateCart(line, quantity);
        });

    }


}

function showUpsellItem(cart) {
    console.log('upsell block hits');
    let cartUpsellSlider = upsell_products[0].closest('.carouselInit');
    var flkty = new Flickity(cartUpsellSlider);
    for (let index = 0; index < upsell_products.length; index++) {
        const element = upsell_products[index];
        if (cart.item_count > 0) {
            cart.items.forEach(function (item, index) {
                let data_id = element.dataset.p_id;
                if (item.product_id != data_id) {
                    console.log(element);
                    element.classList.remove('d-none');
                    flkty.resize();
                }
            })
        } else {
            element.classList.remove('d-none');
            flkty.resize();
        }
    }
}

function updateCart(line, quantity) {
    setTimeout(() => {

        $.ajax({
            type: 'POST',
            url: '/cart/change.js',
            data: 'quantity=' + quantity + '&line=' + line,
            dataType: 'json',
            success: function (cart) {
                if ((typeof callback) === 'function') {
                    callback(cart);
                } else {
                    onCartUpdate(cart);
                    fetchCart();
                    // cartCounter.innerHTML = Number(quantity);
                    // removeProductFromCart();
                }
            },
        });
    }, 500);
}

function sideCartItemInput(qty_btn) {
    fieldName = qty_btn.attr('data-field');
    type = qty_btn.attr('data-type');
    var input = qty_btn.siblings("input[name='" + fieldName + "']");
    var currentVal = parseInt(input.val());
    // console.log(currentVal);
    if (!isNaN(currentVal)) {
        if (type == 'minus') {
            if (currentVal > input.attr('min')) {
                input.val(currentVal - 1).change();
            }
            if (parseInt(input.val()) == input.attr('min')) {
                qty_btn.attr('disabled', true);
            }
        } else if (type == 'plus') {
            if (currentVal < input.attr('max')) {
                input.val(currentVal + 1).change();
            }
            if (parseInt(input.val()) == input.attr('max')) {
                qty_btn.attr('disabled', true);
            }
        }
    } else {
        input.val(0);
    }
}

function openCartDrawer() {
    cartDrawer.classList.add('show');
}

function closeCartDrawer() {
    cartDrawer.classList.remove('show');
}

function clearCartDrawer() {
    cartDrawerContent.innerHTML = '';
}

function openAddModal() {
    cartModal.classList.add('show');
}

function closeAddModal() {
    cartModal.classList.remove('show');
}

function openCartOverlay() {
    cartOverlay.style.display = 'block';

    //   $(".cart-sidebar__overlay").fadeToggle()
    // htmlSelector.classList.add('is-locked');
}

function closeCartOverlay() {
    cartOverlay.style.display = 'none';
    // cartOverlay.classList.remove('is-open');
    // htmlSelector.classList.remove('is-locked');
}

cartModalClose.addEventListener('click', function () {
    // closeAddModal();
    // closeCartOverlay();
});

cartDrawerClose.addEventListener('click', function () {
    // closeCartDrawer();
    // closeCartOverlay();
});
// cart is empty stanje
// cartOverlay.addEventListener('click', function() {
//     closeAddModal();
//     closeCartDrawer();
//     closeCartOverlay();
// });

cartDrawerTrigger.addEventListener('click', function (event) {
    event.preventDefault();
    //fetchCart();
    // openCartDrawer();
    // openCartOverlay();
});

document.addEventListener('DOMContentLoaded', function () {
    fetchCart();
});

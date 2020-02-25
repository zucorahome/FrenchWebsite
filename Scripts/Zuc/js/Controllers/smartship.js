/*

    smartship Controller for the View "smartship"
    Copyright 2019, LimeTAC Inc. All rights reserved.

*/

(function () {

    var U = new LTPublicUtils();
    var CurrentYear = new Date().getFullYear();

    $.when(
        U.AJAX('/API/Core/GetRetailerDatas', 'GET', false, false, 'silent').then(R => R),
        LT.LTCodes.Get('EventTypes'),
        U.AJAX('/API/Core/GetApplicationOwner', 'GET', false, false, 'silent').then(R => R),
        LT.LTCodes.Get('AffiliateLocationRelationTypeOptions'),
        LT.LTCodes.Get('BinTypeOptions'),
        LT.LTCodes.Get('ShipViaList'),
        U.AJAX("/API/Core/ApplicationConfigs?$filter=name eq 'Default_ShipViaCode'", 'GET', false, false, 'silent')
            .then(R => { return (R && R.items && R.items.length && R.items[0].value) ? R.items[0].value : null; }),
        U.AJAX("/API/Core/ApplicationConfigs?$filter=name eq 'Expedited_ShipViaCode'", 'GET', false, false, 'silent')
            .then(R => { return (R && R.items && R.items.length && R.items[0].value) ? R.items[0].value : null; }),
        LT.LTCodes.Find('ConversationTypes', 'code', 'Public'),
        LT.LTCodes.Get('Provinces'),

    ).done(function (RetailerData, EventTypes, ApplicationOwner, AffiliateLocationRelationTypeOptions, BinTypeOptions, ShipViaList,
        DefaultShipViaCode, ExpeditedShipViaCode, PublicConversationType, Provinces) {

        $(function () {



            var Widgets = {};


            // Page Widgets

            //Customer Details
            Widgets.SmartShipContainer = $('.smartShip-container');
            Widgets.SmartShipFirstName = $('#ss-first-name');
            Widgets.SmartShipLastName = $('#ss-last-name');
            Widgets.SmartShipPhone = $('#ss-phone');
            Widgets.SmartShipEmail = $('#ss-email');

            //Ship to Address
            Widgets.SmartShipAddress1 = $('#ss-address-1');
            Widgets.SmartShipAddress2 = $('#ss-address-2');
            Widgets.SmartShipCity = $('#ss-city');
            Widgets.SmartShipProvince = $('#ss-province');
            Widgets.SmartShipPostalCode = $('#ss-postal');


            //New Item
            Widgets.SmartShipItem = $('#ss-item');
            Widgets.SmartShipItemQuantity = $('#ss-item-quantity');
            Widgets.SmartShipItemOptions = $('#ss-item-options');

            //Item List
            Widgets.SmartShipItemList = $('.ss-item-list');
            Widgets.SmartShipItemListTaxes = $('.ss-item-list-taxes');
            Widgets.SmartShipItemListTotal = $('.ss-item-list-total');

            //Checkout Button
            Widgets.SmartShipCheckOutButton = $('.ss-checkout');


            // Payment Widgets 
            Widgets.PaymentModalBox = $('.oe-payment-modal-container'); // Payment Modal
            Widgets.PaymentPlaceOrderButton = $('.oe-payment-done');
            Widgets.PaymentModalBoxCloseButton = Widgets.PaymentModalBox.find('span.close-modal');
            Widgets.PaymentOrderTotal = $('span.total-order-amount');
            Widgets.PaymentRewardRedemptionAmount = Widgets.PaymentModalBox.find('span.rewards-redemption-amount');
            Widgets.PaymentNetAmount = $('span.net-amount');
            Widgets.PaymentOptionsList = $('ul.oe-payment-options:not([class="oe-payment-options oe-payment-options-buying-group"]');
            Widgets.PaymentOrderFreightAmount = $('span.total-freight-amount');
            Widgets.PaymentOrderTaxAmount = $('span.total-tax1-tax2-amount');
            Widgets.PaymentOrderGrandTotalAmount = $('span.grand-total-amount');

            Widgets.AddCreditCardModal = $('.oe-credit-cards-add-modal-container').on('click', '.close-modal', () => { Widgets.AddCreditCardModal.addClass('non-visible') });
            Widgets.AddCreditCardName = $('#oe-credit-cards-add-name-on-card', Widgets.AddCreditCardModal);
            Widgets.AddCreditCardNumber = $('#oe-credit-cards-add-card-number', Widgets.AddCreditCardModal);
            Widgets.AddCreditCardMonth = $('#oe-credit-cards-add-expiry-month', Widgets.AddCreditCardModal);
            Widgets.AddCreditCardYear = $('#oe-credit-cards-add-expiry-year', Widgets.AddCreditCardModal);
            Widgets.AddCreditCardCVV = $('#oe-credit-cards-add-cvv', Widgets.AddCreditCardModal);
            Widgets.AddCreditCardBillingAddresses = $('.oe-credit-cards-add-billing-addresses', Widgets.AddCreditCardModal);
            Widgets.AddCreditCardBillingAddressAdd = $('.oe-credit-cards-add-billing-address-add', Widgets.AddCreditCardModal).hide();
            [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].forEach(Addend => {
                var YYYY = CurrentYear + Addend;
                var HTML = `<option value="${YYYY}">${YYYY}</option>`;
                Widgets.AddCreditCardYear.append(HTML);
            });

            //ThankYou Modal
            Widgets.ThankYouModalBox = $('.oe-thank-you-modal-container'); // ThankYou Modal


            // init
            if (Provinces) {
                Provinces.forEach(L => { Widgets.SmartShipProvince.append(`<option value="${L.id}" lt-data-countryid="${L.countryId}">${L.code}</option>`) });
            }



            Widgets.SmartShipItem.on('input', function () {
                if (Widgets.SmartShipItem.val()) {
                    console.log(Widgets.SmartShipItem.val());
                    var TextSoFar = Widgets.SmartShipItem.val() || null;
                    if (TextSoFar && TextSoFar.length > 2) {
                        U.AJAX(`/API/Inventory/GetItemsBasedOnPriceDetail/${RetailerData.retailerAffiliate.id}?$filter=(substringof('${TextSoFar}',code) eq true or substringof('${TextSoFar}',description) eq true)&$top=250`, 'GET', false, false, 'silent')
                            .then(R => {
                                Widgets.SmartShipItemOptions.empty();
                                R.items.forEach(T => {

                                    Widgets.SmartShipItemOptions.append(`<option value="${T.code}" data-lt-value="${T.id}" 
                                                                    data-lt-caseQunatity="${T.caseQuantity}" 
                                                                    data-lt-itemType="${T.itemType}" 
                                                                    data-lt-itemCategory="${T.itemCategory}" 
                                                                    data-lt-itemCode="${T.code}" 
                                                                    data-lt-itemDescription="${T.description}" 
                                                                    data-lt-itemAmountType="${T.amountType}" 
                                                                    data-lt-msrp="${T.msrp}" 
                                                                    >${T.description}</option>`);
                                });
                            });
                    }
                }
            });

            Widgets.SmartShipItemList.on('click', '.RemoveItem', function () {
                $(this).closest('tr').remove();
                Widgets.FormValidation();
                Widgets.UpdateOrderTotal();

            });

            Widgets.SmartShipItemSaveButton = $('.ss-item-save').on('click', function () {
                var Btn = $(this);

                var TBody = $(`.ss-item-list tbody`);
                const textValue = Widgets.SmartShipItem.val() || null;
                const selectedOption = Widgets.SmartShipItemOptions.find(`option[value="${textValue}"]`);
                const itemId = selectedOption.attr("data-lt-value");
                const itemType = selectedOption.attr("data-lt-itemType");
                const itemCategory = selectedOption.attr("data-lt-itemCategory");
                const itemCode = selectedOption.attr("data-lt-itemCode");
                const itemDescription = selectedOption.attr("data-lt-itemDescription");
                const itemAmountType = selectedOption.attr("data-lt-itemAmountType");
                const msrp = selectedOption.attr("data-lt-msrp");
                const itemQuantity = parseFloat(Widgets.SmartShipItemQuantity.val() || 0);

                var itemIndex = null;

                if (itemQuantity > 0) {
                    var salesEventTypeId = EventTypes.find(T => ['Sales Order'].indexOf(T.name) > -1).id;
                    Widgets.GetPriceDetail({
                        AffiliateId: RetailerData.retailerAffiliate.id,
                        CountryId: RetailerData.retailerAffiliate.countryId,
                        EventTypeId: salesEventTypeId,
                        ItemId: itemId,
                        Quantity: itemQuantity,
                        FallbackPriceSource: 'Msrp'
                    }).done(result => {
                        const unitPrice = result.listPrice || result.amount || result.caseAmount || 0;

                        var Data = {
                            ItemId: parseInt(itemId, 10),
                            ItemCode: itemCode,
                            ItemDescription: itemDescription,
                            ItemAmountType: itemAmountType,
                            ItemQuantity: parseInt(itemQuantity, 10),
                            ItemType: itemType,
                            ItemCategory: itemCategory,
                            UnitPrice: parseFloat(unitPrice),
                            DoBackOrder: true,

                        };

                        const uniqueId = U.GenerateUniqueString();

                        //<td data-label="ItemCategory">${Data.ItemCategory || ''}</td>
                        var RowHTML = "";
                        if (Data.ItemQuantity > 0) {
                            RowHTML = `<tr data-lt-uniqueId="${uniqueId}" class="new-itemAdd individual-item" data-lt-model="${encodeURIComponent(JSON.stringify(Data))}">
                            <td data-label="SKU Number">${Data.ItemCode || ''}</td>
                            <td data-label="QTY">${Data.ItemQuantity}</td>
                            <td data-label="Unit Price">$${Data.UnitPrice.toFixed(2)}</td>
                            <td data-label="Total">$${U.PrepMathForView(U.PrepMoneyForMath(Data.UnitPrice) * U.PrepMoneyForMath(Data.ItemQuantity), 1)}</td>
                            <td data-label="Delete"><i class="fa fa-trash-alt RemoveItem" style="cursor: pointer;"></i></td>
                        </tr>`;
                        }


                        if (U.IsNumber(itemIndex) && TBody.find(`tr.individual-item[data-lt-uniqueId="${rowUniqueId}"]`).length) {
                            TBody.find(`tr.individual-item[data-lt-uniqueId="${rowUniqueId}"]`).replaceWith(RowHTML); // edit

                        } else {
                            $(RowHTML).appendTo(TBody); // add
                        }
                        Widgets.SmartShipItem.val('');
                        Widgets.SmartShipItemQuantity.val('');

                        Widgets.FormValidation();
                        Widgets.UpdateOrderTotal();

                    });
                }


            });

            Widgets.GetPriceDetail = function (parameters) {
                var Promise = new $.Deferred();

                U.AJAX(
                    '/API/InventoryReservation/v1/GetItemPrices', 'POST',
                    {
                        Parameters: [{
                            AffiliateId: parameters.AffiliateId,
                            CountryId: parameters.CountryId,
                            EventTypeId: parameters.EventTypeId,
                            ItemId: parameters.ItemId,
                            Quantity: parameters.Quantity,
                            FallbackPriceSource: parameters.FallbackPriceSource
                        }],
                    },
                    false, 'silent', true
                ).then(R => Promise.resolve(R[0]));
                return Promise;
            };

            var FormElems = $('input:required, select:required', Widgets.SmartShipContainer);
            FormElems.on('change', function () {
                Widgets.FormValidation();
            });

            Widgets.FormValidation = function () {
                var Valid = true;
                FormElems.each(function () {
                    if (!$(this)[0].validity.valid) {
                        Valid = false;
                        return false;
                    }
                });

                console.log(Valid, Widgets.SmartShipItemList.find('tr.new-itemAdd').length);
                Valid && Widgets.SmartShipItemList.find('tr.new-itemAdd').length
                    ? Widgets.SmartShipCheckOutButton.css('background', '').prop('disabled', false)
                    : Widgets.SmartShipCheckOutButton.css('background', '#d9d8d6').prop('disabled', true);
            };
            FormElems.first().trigger('change');

            Widgets.UpdateOrderTotal = function () {
                let totalOrder = 0;
                Widgets.SmartShipItemList.find('.new-itemAdd').each(function () {
                    var TR = $(this);
                    const model = JSON.parse(decodeURIComponent(TR.attr('data-lt-model')));
                    totalOrder += parseFloat(model.UnitPrice) * parseFloat(model.ItemQuantity);
                });
                const tax = (totalOrder * 0.13);
                Widgets.SmartShipItemListTaxes.html(tax.toFixed(2));
                Widgets.SmartShipItemListTotal.html((totalOrder + tax).toFixed(2));
                Widgets.SmartShipItemListTotal.attr("lt-items-total-value", totalOrder);

            };


            Widgets.ResetScreen = function () {
                Widgets.SmartShipItemList.find('.new-itemAdd').each(function () {
                    var TR = $(this);
                    TR.find(".RemoveItem").trigger('click');
                });
                //Widgets.OrderItemsTotal.html(totalOrder.toFixed(2));
            };





            //CheckOut
            Widgets.SmartShipCheckOutButton.on('click', function () {

                //Widgets.PaymentPlaceOrderButton.css('background', '#d9d8d6').prop('disabled', true);
                //Widgets.PaymentOrderTotal.text(Widgets.SmartShipItemListTotal.text());

                //const rewardsAmount = parseFloat(Widgets.PaymentRewardRedemptionAmount.text().substr(1));
                //const orderTotal = parseFloat(parseFloat(Widgets.PaymentOrderTotal.text()));
                //Widgets.PaymentNetAmount.text(parseFloat(orderTotal - rewardsAmount).toFixed(2));


                let orderItemsTotalAmount = parseFloat(Widgets.SmartShipItemListTotal.attr("lt-items-total-value"));
                let tax = parseFloat(Widgets.SmartShipItemListTaxes.text());
                let grandTotal = orderItemsTotalAmount + tax;

                Widgets.PaymentPlaceOrderButton.css('background', '#d9d8d6').prop('disabled', true);
                Widgets.PaymentOrderTotal.text(orderItemsTotalAmount.toFixed(2));
                Widgets.PaymentOrderFreightAmount.text('0');
                Widgets.PaymentOrderTaxAmount.text(tax.toFixed(2));
                Widgets.PaymentOrderGrandTotalAmount.text(grandTotal.toFixed(2));
                Widgets.PaymentRewardRedemptionAmount.text('0');

                const rewardsAmount = parseFloat(Widgets.PaymentRewardRedemptionAmount.text().substr(1)) || 0;
                const orderTotal = parseFloat(Widgets.PaymentOrderGrandTotalAmount.text());
                Widgets.PaymentNetAmount.text(parseFloat(orderTotal - rewardsAmount).toFixed(2));

                Widgets.RenderPaymentOptions();
                Widgets.PaymentModalBox.removeClass('non-visible');
            });



            //Payment 
            Widgets.PaymentModalBoxCloseButton.on('click', function () {
                Widgets.PaymentModalBox.addClass('non-visible');
            });

            Widgets.PaymentPlaceOrderButton.on('click', function () {
                var selectedPaymentOption = Widgets.PaymentModalBox.find('input:radio:checked');
                Widgets.ThankYouModalBox.find(".oe-thank-you-buying-group-container, .oe-thank-you-credit-card-container, .oe-thank-you-on-account-container, .oe-thank-you-heading-on-account").hide();

                const BillingAffiliateLocationId = parseInt(Widgets.PaymentOptionsList.find('[name="payment-option"]:checked').attr("lt-data-id")) || null;

                if (selectedPaymentOption.val() === "credit-card" && BillingAffiliateLocationId) {
                    let orderId = null;
                    $.when(Widgets.AddEvent()).done(function (eventId) {
                        orderId = eventId;
                        console.log("SubmitOrder", orderId);
                        Widgets.ThankYouModalBox.find("span.oe-thank-you-order-number").text(orderId);
                        $.when(Widgets.MakePayment(orderId), Widgets.AddShippingAddress()).done((payment, affiliateShippingLocation) => {
                            $.when(Widgets.AddEventItems(orderId, affiliateShippingLocation)).done((eventitems) => {
                                console.log(eventitems);
                                Widgets.ThankYouModalBox.find(".oe-thank-you-credit-card-container").show();
                                Widgets.ThankYouModalBox.removeClass('non-visible');
                            });
                        });
                    });
                    console.log("credit card");
                }
                else {
                    $.when(Widgets.SubmitOrder()).done((orderId) => {
                        console.log("SubmitOrder");
                        Widgets.ThankYouModalBox.find("span.oe-thank-you-buying-group").text(selectedPaymentOption.attr("lt-data-name"));
                        Widgets.ThankYouModalBox.find(".oe-thank-you-buying-group-container").show();
                        Widgets.ThankYouModalBox.find("span.oe-thank-you-order-number").text(orderId);

                        Widgets.ThankYouModalBox.removeClass('non-visible');

                    });

                }
                Widgets.PaymentModalBox.addClass('non-visible');

            });

            Widgets.PaymentModalBox.on('click', 'a.oe-payment-add-card ', function () {
                Widgets.AddCreditCardModal.find('input, select').val('');
                Widgets.AddCreditCardBillingAddresses.empty();
                Widgets.RenderCCBillingAddresses();
                Widgets.PaymentModalBox.addClass('non-visible');
                Widgets.AddCreditCardModal.removeClass('non-visible');


            });

            Widgets.PaymentModalBox.on('click', 'input:radio[name="payment-option"]', function () {
                Widgets.PaymentPlaceOrderButton.css('background', '').prop('disabled', false)
            });

            Widgets.RenderPaymentOptions = function () {
                Widgets.PaymentOptionsList.empty();
                if (RetailerData.creditCards) {
                    RetailerData.creditCards.forEach(C => {
                        C.cardType = U.DetermineCreditCardType(C.cardNumber) || "card  fa-credit-card";
                        Widgets.PaymentOptionsList.append(`<li class="flex flex-vert-center">
                        <input type="radio" name="payment-option" for="" value="credit-card" lt-data-id="${C.cardId}" >
                        <div class="payment-card-info">
                            <div class="flex flex-vert-center">
                                <i class="fab fa-cc-${C.cardType}" style="color: #1a1f71;"></i>
                                <p class="u-bold"><span class="card-type">Visa</span> ending in <span class="ending-numbers">${C.cardNumber.slice(C.cardType === 'Amex' ? -5 : -4)}</span></p>
                            </div>
                            <div>${C.cardName}</div>
                            <div>${C.cardExpireTime}</div>
                        </div>
                    </li>`);

                    });
                }
                if (RetailerData.buyingGroup) {
                    const buyingGroup = RetailerData.buyingGroup;
                    Widgets.PaymentOptionsList.append(` <li class="flex flex-vert-center">
                    <input type="radio" name="payment-option" for="" value="buying-group" lt-data-name="${buyingGroup.name}" lt-data-id="${buyingGroup.id}">
                    <div class="flex flex-vert-center">
                        <p class="u-bold">Use "Buying Group"</p>
                        <i class="fa fa-info-circle"></i>
                        <div class="buying-group-info-container non-visible">
                            <i class="fa fa-caret-up"></i>
                            <p class="info-text">It appears you are a member of <span class="oe-payment-options-buying-group-name">${buyingGroup.name}</span>. Do you wish to purchase through your Group?</p>
                        </div>
                    </div>
                </li>`);
                }
            };

            // Credit Card 
            Widgets.AddCreditCardSave = $('.oe-credit-cards-add-done', Widgets.AddCreditCardModal).on('click', function () {


                var BillingAddressId = Widgets.AddCreditCardBillingAddresses.find('[name="oe-credit-cards-add-billing-address"]:checked').val() || null;
                var CC = {
                    Name: Widgets.AddCreditCardName.val().trim() || null,
                    Number: Widgets.AddCreditCardNumber.val().replace(/[^0-9]/g, '') || null,
                    Type: null,
                    ExpiryMonth: Widgets.AddCreditCardMonth.val() || null,
                    ExpiryYear: Widgets.AddCreditCardYear.val() || null,
                    CVV: Widgets.AddCreditCardCVV.val() || null,
                    BillingAddress: null,
                    IsDefault: false,
                };
                if (!CC.Name) {
                    Widgets.AddCreditCardName.select();
                    return false;
                }
                if (!CC.Number) {
                    Widgets.AddCreditCardNumber.select();
                    return false;
                } else {
                    CC.Type = U.DetermineCreditCardType(CC.Number);
                }
                if (!CC.ExpiryMonth) {
                    Widgets.AddCreditCardMonth.select();
                    return false;
                }
                if (!CC.ExpiryYear) {
                    Widgets.AddCreditCardYear.select();
                    return false;
                }
                if (!CC.CVV) {
                    Widgets.AddCreditCardCVV.select();
                    return false;
                }
                if (!BillingAddressId) {
                    return false;
                }
                if (BillingAddressId > -1) {
                    console.log(BillingAddressId);
                    CC.BillingAddress = RetailerData.shipToAndBilToLocations.find(L => L.id == BillingAddressId);
                }

                $.when(Widgets.GenerateCreditCards(CC)).then((R) => {
                    console.log(R);
                    if (!RetailerData.creditCards)
                        RetailerData.creditCards = [];

                    U.AJAX(`/API/Core/AffiliateLocations/${R.affiliateLocationId}`, 'GET', false, false, 'silent')
                        .then(newLocation => {
                            RetailerData.creditCards.push(
                                {
                                    cardId: newLocation.locationId,
                                    cardName: newLocation.name,
                                    cardNumber: newLocation.webAddress,
                                    cardExpireTime: newLocation.cardExpireTime
                                });
                            Widgets.AddCreditCardModal.addClass('non-visible');
                            Widgets.PaymentModalBox.removeClass('non-visible');
                            Widgets.RenderPaymentOptions();
                        });

                });

            });

            Widgets.GenerateCreditCards = function (cardInfo) {
                return U.AJAX('/api/PaymentService/v2/CreateBillingAddress', 'POST',
                    {
                        affiliateId: RetailerData.retailerAffiliate.id,
                        address: {
                            address1: cardInfo.BillingAddress.address1,
                            address2: cardInfo.BillingAddress.address2,
                            city: cardInfo.BillingAddress.cityName,
                            provinceId: cardInfo.BillingAddress.provinceId,
                            countryId: cardInfo.BillingAddress.countryId,
                            postalCode: cardInfo.BillingAddress.postalCode,
                            phone: cardInfo.BillingAddress.phoneNumber,
                            email: null,
                        },
                        cardholderName: cardInfo.Name,
                        cardNumber: cardInfo.Number,
                        cardVerificationValue: cardInfo.CVV,
                        expiry: cardInfo.ExpiryYear + '-' + cardInfo.ExpiryMonth,
                    },
                    false, 'normal', true
                );
            };

            Widgets.RenderCCBillingAddresses = function () {

                RetailerData.shipToAndBilToLocations = RetailerData.locations.concat(RetailerData.billToLocations);

                RetailerData.shipToAndBilToLocations.forEach(BillToData => {
                    if (BillToData) {

                        Widgets.AddCreditCardBillingAddresses.append(
                            `<div class="flex flex-vert-center">
                        <input id="oe-credit-cards-add-billing-address-${BillToData.id}" name="oe-credit-cards-add-billing-address" type="radio" value="${BillToData.id}" />
                        <label for="oe-credit-cards-add-billing-address-${BillToData.id}">
                            ${U.RenderAddress(BillToData, Provinces, null, false, false, true)}
                        </label>
                    </div>`
                        );
                    }
                });


            };

            Widgets.MakePayment = function (eventId) {
                const BillingAffiliateLocationId = parseInt(Widgets.PaymentOptionsList.find('[name="payment-option"]:checked').attr("lt-data-id")) || null;

                return U.AJAX(
                    '/API/paymentService/v2/MakePayment', 'POST',
                    {
                        BillingAffiliateLocationId: BillingAffiliateLocationId,
                        Total: parseFloat(Widgets.PaymentNetAmount.text()),
                        CurrencyId: RetailerData.retailerAffiliate.currencyId,
                        EventId: eventId || null,
                        ApplyPayment: true,
                    },
                    false, 'normal', true);
            };

            // Thank You
            Widgets.ThankYouModalBox.on('click', 'span.close-modal, button.zuc-btn-secondary', function () {
                Widgets.ResetScreen();
                Widgets.ThankYouModalBox.addClass('non-visible');
            });


            // Process Order 

            Widgets.AddEvent = function () {
                var Promise = new $.Deferred();
                var EventType = EventTypes.find(T => ['Sales Order'].indexOf(T.name) > -1).name;
                var Route = null;
                var Data = {
                    CustomColumns: [],
                    ReviewStatus: 0,
                    Tag1: U.GenerateUniqueString(),
                    Tag2: null,
                    DiscountPercentage: 0,
                };

                switch (EventType) {
                    case 'Purchase Order':
                        Route = '/API/PurchaseOrderManagement/v1/CreatePurchaseOrder';
                        Data.SupplierAffiliateId = RetailerData.retailerAffiliate.id;
                        break;
                    case 'Sales Order':
                        Route = '/API/SalesOrderManagement/v1/CreateSalesOrder';
                        Data.CustomerAffiliateId = RetailerData.retailerAffiliate.id;
                        break;
                }
                U.AJAX(Route, 'POST', Data, false, 'normal', true)
                    .then(function (EventId) {
                        Promise.resolve(EventId);
                    });
                return Promise;
            };

            Widgets.AddEventItems = function (EventId, affiliateShippingLocation) {
                var Promise = new $.Deferred();
                var Route = null;
                var Data = { Items: [] };
                var EventType = EventTypes.find(T => ['Sales Order'].indexOf(T.name) > -1).name;
                switch (EventType) {
                    case 'Purchase Order':
                        Route = '/API/PurchaseOrderManagement/v1/AddEventItems';
                        Data.PurchaseOrderEventId = EventId;
                        break;
                    case 'Sales Order':
                        Route = '/API/SalesOrderManagement/v1/AddEventItems';
                        Data.SalesOrderEventId = EventId;
                        break;
                }
                let shipViaCode = DefaultShipViaCode;
                Widgets.SmartShipItemList.find('.new-itemAdd').each(function () {
                    var TR = $(this);
                    const model = JSON.parse(decodeURIComponent(TR.attr('data-lt-model')));
                    const quantity = model.ItemQuantity;
                    var itemData = {
                        ItemId: model.ItemId,
                        Quantity: model.ItemQuantity,
                        CustomerUnitAmount: model.UnitPrice,
                        Description: model.ItemDescription || null,
                        ShipFromLocationId: RetailerData.retailerAffiliate.locationId,
                        ShipToLocationId: affiliateShippingLocation.locationId,
                        ShipViaId: model.ShipViaId || ShipViaList.find(x => x.code === shipViaCode) ? ShipViaList.find(x => x.code === shipViaCode).id : ShipViaList[0].id,
                        ShipTermId: model.ShipTermId || null,
                        CarrierAccountNumber: model.CarrierAccountNumber || null,
                        AutoStockBehaviour: model.AutoStockBehaviour || 'Standard',
                        FlowControl: model.FlowControl || 'AutoReserve',
                        AmountType: model.ItemAmountType,
                        DiscountPercentage: model.DiscountPercentage || 0,
                        ClientIdentifier: model.ClientIdentifier || U.GenerateUniqueString(),
                        //ActionTime: undefined

                    };
                    Data.Items.push(itemData);
                });



                $.when(U.AJAX(Route, 'POST', Data, false, 'normal', true))
                    .then(function (Results) {
                        Promise.resolve(Results);
                    });
                return Promise;
            };

            Widgets.AddShippingAddress = function () {
                var Promise = new $.Deferred();
                var SelectedProvince = Widgets.SmartShipProvince.find('option:selected');
                var Data = {
                    FirstName: Widgets.SmartShipFirstName.val(),
                    LastName: Widgets.SmartShipLastName.val(),
                    FullName: `${Widgets.SmartShipFirstName.val()} ${Widgets.SmartShipLastName.val()}`,
                    HomePhone: Widgets.SmartShipPhone.val(),
                    Email: Widgets.SmartShipEmail.val(),
                    Address1: Widgets.SmartShipAddress1.val().trim(),
                    Address2: Widgets.SmartShipAddress2.val() ? Widgets.SmartShipAddress2.val().trim() : null,
                    City: Widgets.SmartShipCity.val(),
                    ProvinceId: Widgets.SmartShipProvince.val(),
                    CountryId: SelectedProvince.attr("lt-data-countryid"),
                    PostalCode: Widgets.SmartShipPostalCode.val().trim(),
                };
                console.log(Data);
                U.AJAX('/API/FieldService/CreateAffiliateAndShipToLocation', 'POST', Data,
                    false, 'silent', true
                ).then(R => Promise.resolve(R));

                return Promise;
            };

            U.ShowUI();

        });
    });

})();
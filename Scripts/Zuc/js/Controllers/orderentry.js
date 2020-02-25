/*

    orderentry Controller for the View "orderentry"
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
            Widgets.Origin = null;


            // Page Widgets
            Widgets.OrderEntryBox = $('.order-entry-container');
            Widgets.OrderEntrySubmitButton = $('.oe-submit');
            Widgets.OrderEntryPoRef = $('input[id="oe-po-ref"]');
            Widgets.OrderEntryExpeditedShipping = $('input[id="oe-request-expedited-shipping"]');
            Widgets.OrderEntryShipAfterDate = $('input[id="oe-ship-after-date"]');
            Widgets.OrderEntryShippingInstruction = $('textarea[id="oe-shipping-instructions"]');
            Widgets.OrderEntryRemoveOrderButton = $('a.oe-remove-order');

            Widgets.Store = $('select[id="oe-location"]');

            Widgets.OrderAddItemsButton = $('.oe-add-item');// Show Add Item Modal
            Widgets.OrderItemsTable = $('.oe-items');// Order Items Table
            Widgets.OrderItemsTotal = Widgets.OrderItemsTable.find('td.oe-items-total');// Order Items Total

            Widgets.OrderItemBox = $('.oe-add-item-modal-container'); // Add Item Modal box
            Widgets.OrderItemSaveAndAddItemButton = $('.oe-add-item-add-more');
            Widgets.OrderItemAddItemButton = $('.oe-add-item-add');

            Widgets.OrderItemItem = $('input[id="oe-add-item-item"]'); // Item textbox
            Widgets.OrderItemList = Widgets.OrderItemBox.find('datalist[id="oe-add-item-item-options"]')
            Widgets.OrderItemUnitQuantity = Widgets.OrderItemBox.find('input[id="oe-add-item-unit-quantity"]');
            Widgets.OrderItemUnitQuantityAmount = Widgets.OrderItemBox.find('input[id="oe-add-item-unit-quantity-amount"]');
            Widgets.OrderItemCaseQuantity = Widgets.OrderItemBox.find('input[id="oe-add-item-case-quantity"]');
            Widgets.OrderItemCaseQuantityAmount = Widgets.OrderItemBox.find('input[id="oe-add-item-case-quantity-amount"]');
            Widgets.OrderItemCaseUnits = Widgets.OrderItemBox.find('span.oe-add-item-case-units');
            Widgets.OrderItemTotalUnits = Widgets.OrderItemBox.find('span.oe-add-item-total-units');
            Widgets.OrderItemAvailableUnits = Widgets.OrderItemBox.find('span.oe-add-item-available-units');
            Widgets.OrderItemDoBackOrder = Widgets.OrderItemBox.find('input[id="oe-add-item-do-backorder"]');
            Widgets.OrderItemDoNotBackOrder = Widgets.OrderItemBox.find('input[id="oe-add-item-do-not-backorder"]');
            Widgets.CloseModalButton = Widgets.OrderItemBox.find('span.close-modal');
            Widgets.OrderItemBackOrderContainer = Widgets.OrderItemBox.find('div.oe-add-item-backorder-container');


            Widgets.OrderItemBackOrderModal = $('.oe-backorder-warning-modal-container'); // Back Order Modal box
            Widgets.OrderItemBackOrderCloseButton = Widgets.OrderItemBackOrderModal.find('span.close-modal');
            Widgets.OrderItemBackOrderProceedButton = Widgets.OrderItemBackOrderModal.find('button.oe-backorder-warning-proceed');
            Widgets.OrderItemBackOrderWarningItems = Widgets.OrderItemBackOrderModal.find('table.oe-backorder-warning-items');


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


            // Order
            if (RetailerData.locations != null) {
                RetailerData.locations.forEach(L => { if (L.isActive) Widgets.Store.append(`<option value="${L.id}">${L.name}</option>`) });
            }

            Widgets.OrderAddItemsButton.on('click', function () {

                var ShipFromAddressRelTypeId = AffiliateLocationRelationTypeOptions.find(O => O.code == 'ShipFromAddress').id;

                U.AJAX(`/API/Core/AffiliateLocations/-1/null/null/${ShipFromAddressRelTypeId}?geofenceIdListString=&$filter=affiliateId eq ${ApplicationOwner.id}&$orderby=locationName asc&$top=1`
                    , 'GET', false, false, 'silent').then(R => {
                        if (R && R.items && R.items.length)
                            Widgets.Origin = R.items[0];
                    });





                Widgets.OrderItemSaveAndAddItemButton.show();
                Widgets.OrderItemAddItemButton.text('Add');

                Widgets.OrderItemItem.val('').trigger('change');
                Widgets.OrderItemList.empty();
                Widgets.OrderItemUnitQuantity.val('');
                Widgets.OrderItemUnitQuantityAmount.val('');
                Widgets.OrderItemCaseQuantity.val('');
                Widgets.OrderItemCaseQuantityAmount.val('');
                Widgets.OrderItemCaseUnits.text('');
                Widgets.OrderItemTotalUnits.text('');
                Widgets.OrderItemAvailableUnits.text('');
                Widgets.OrderItemDoBackOrder.prop("checked", true);
                Widgets.OrderItemDoNotBackOrder.prop("checked", false);

                Widgets.OrderItemBackOrderContainer.hide();

                Widgets.OrderItemBox.removeClass('non-visible');


            });

            Widgets.CloseModalButton.on('click', function () {
                Widgets.OrderItemBox.addClass('non-visible').removeAttr('data-lt-item-index').removeAttr('data-lt-row-uniqueid');
            });

            Widgets.OrderItemsTable.on('click', '.EditItem', function () {
                Widgets.OrderItemSaveAndAddItemButton.hide();
                Widgets.OrderItemAddItemButton.text('Save');

                var Icon = $(this);
                var TR = Icon.closest('tr');
                var Model = JSON.parse(decodeURIComponent(TR.attr('data-lt-model')));
                Widgets.OrderItemBox.removeClass('non-visible').attr('data-lt-item-index', TR.index()).attr('data-lt-row-uniqueid', TR.attr('data-lt-uniqueid'));
                Widgets.OrderItemItem.val(Model.ItemCode).trigger('change');
                Widgets.OrderItemUnitQuantity.val(Model.ItemQuantity);
                Widgets.OrderItemUnitQuantityAmount.val(Model.UnitPrice);
                Widgets.OrderItemCaseQuantity.val(Model.NumberOfCases);
                Widgets.OrderItemCaseQuantityAmount.val(Model.CasePrice);
                Widgets.OrderItemCaseUnits.text(Model.CaseUnits);
                Widgets.OrderItemTotalUnits.text(Model.UnitsToBeAdded);
                Widgets.OrderItemAvailableUnits.text(Model.AvailableUnits);
                Widgets.OrderItemDoBackOrder.prop("checked", Model.DoBackOrder).trigger('click');

                Widgets.UpdateOrderTotal();

            }).on('click', '.RemoveItem', function () {
                $(this).closest('tr').remove();
                Widgets.FormValidation();
                Widgets.UpdateOrderTotal();

            });


            // Order Item
            var OrderItemFormElems = $('input:not([type="hidden"]), select:not([type="hidden"])', Widgets.OrderItemBox);
            OrderItemFormElems.on('change', function () {
                var Valid = true;
                OrderItemFormElems.each(function () {
                    if (!$(this)[0].validity.valid) {
                        Valid = false;
                        return false;
                    }
                });
                Valid
                    ? Widgets.OrderItemBoxSaveBtns.css('background', '').prop('disabled', false)
                    : Widgets.OrderItemBoxSaveBtns.css('background', '#d9d8d6').prop('disabled', true);
            });

            Widgets.OrderItemItem.on('change', function () {

                console.log(Widgets.Origin);
                Widgets.OrderItemCaseUnits.text('');
                const textValue = Widgets.OrderItemItem.val() || null;
                const selectedOption = Widgets.OrderItemList.find(`option[value="${textValue}"]`);
                const itemId = selectedOption.attr("data-lt-value");
                const caseQuantity = selectedOption.attr("data-lt-caseQunatity");
                Widgets.OrderItemCaseUnits.text(caseQuantity);

                Widgets.OrderItemUnitQuantity.val('');
                Widgets.OrderItemUnitQuantityAmount.val('');
                Widgets.OrderItemCaseQuantity.val('');
                Widgets.OrderItemCaseQuantityAmount.val('');
                Widgets.OrderItemTotalUnits.text('');
                Widgets.OrderItemAvailableUnits.text('');

                var OriginId = (Widgets.Origin || { locationId: null }).locationId;
                console.log(OriginId);
                if (OriginId && itemId) {
                    Widgets.GetAvailableQuantity(itemId, OriginId)
                        .done(Q => {
                            Widgets.OrderItemAvailableUnits.text(Q);
                        });
                }

            });

            Widgets.OrderItemItem.on('input', function () {
                if (Widgets.OrderItemItem.val()) {
                    var TextSoFar = Widgets.OrderItemItem.val() || null;
                    if (TextSoFar && TextSoFar.length > 2) {
                        U.AJAX(`/API/Inventory/GetItemsBasedOnPriceDetail/${RetailerData.retailerAffiliate.id}?$filter=(substringof('${TextSoFar}',code) eq true or substringof('${TextSoFar}',description) eq true)&$top=250`, 'GET', false, false, 'silent')
                            .then(R => {
                                Widgets.OrderItemList.empty();
                                R.items.forEach(T => {

                                    Widgets.OrderItemList.append(`<option value="${T.code}" data-lt-value="${T.id}" 
                                                                    data-lt-caseQunatity="${T.caseQuantity}" 
                                                                    data-lt-itemType="${T.itemType}" 
                                                                    data-lt-itemCategory="${T.itemCategory}" 
                                                                    data-lt-itemCode="${T.code}" 
                                                                    data-lt-itemDescription="${T.description}" 
                                                                    data-lt-itemAmountType="${T.amountType}" 
                                                                    >${T.description}</option>`);
                                });
                            });
                    }
                }
                else {
                    //primaryContactId = null;
                    //Widgets.PrimaryContactEmail.val('');
                    //Widgets.PrimaryContactPhone.val('');
                }
            });

            Widgets.OrderItemBox.on('click', 'input[id="oe-add-item-do-backorder"], input[id="oe-add-item-do-not-backorder"]', function () {
                var IsChecked = $(this).prop('checked');
                var group = "input:checkbox[name='" + $(this).attr("name") + "']";
                console.log(IsChecked);
                if (IsChecked) {
                    $(group).prop("checked", false);
                    $(this).prop("checked", true);
                }
                else {
                    //$(group).prop("checked", true);
                    //$(this).prop("checked", false);
                }

                let itemQuantity = parseFloat(Widgets.OrderItemUnitQuantity.val() || 0);
                let numberOfCases = parseFloat(Widgets.OrderItemCaseQuantity.val() || 0);
                const textValue = Widgets.OrderItemItem.val() || null;
                const selectedOption = Widgets.OrderItemList.find(`option[value="${textValue}"]`);
                const caseQuantity = parseFloat(selectedOption.attr("data-lt-caseQunatity") || 0);
                let unitsToBeAdded = parseFloat(itemQuantity + numberOfCases * caseQuantity);

                Widgets.OrderItemTotalUnits.text(unitsToBeAdded);
                const availableUnits = parseFloat(Widgets.OrderItemAvailableUnits.text());

                console.log($(this).attr("id"));
                console.log(unitsToBeAdded);
                console.log(availableUnits);
                if ($(this).attr("id") == 'oe-add-item-do-not-backorder' && unitsToBeAdded > availableUnits) {
                    Widgets.OrderItemTotalUnits.text(availableUnits);

                    Widgets.OrderItemCaseQuantity.val(parseInt(availableUnits / caseQuantity));
                    Widgets.OrderItemUnitQuantity.val(parseInt(availableUnits % caseQuantity));
                }

            });

            Widgets.GetAvailableQuantity = function (ItemId, LocationId) {
                var Promise = new $.Deferred();

                var BinTypeIds = [
                    BinTypeOptions.find(O => O.code == 'Making').id,
                    BinTypeOptions.find(O => O.code == 'OnHand').id
                ];

                U.AJAX(
                    `/API/Inventory/ItemBins/false/false?$filter=itemId eq ${ItemId} and (binType eq ${BinTypeIds.join(' or binType eq ')}) and binWarehouseId eq ${LocationId}`,
                    'GET', false, false, 'silent'
                ).then(Result => {
                    Promise.resolve(parseFloat(
                        U.PrepMathForView(
                            Result.items.reduce((A, R) => A + (U.PrepMoneyForMath(R.quantity) - U.PrepMoneyForMath(R.reservedQuantity)), 0)
                        )
                    ));
                });
                return Promise;

            };

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

            Widgets.CalculateQuantity = function () {

                let itemQuantity = parseFloat(Widgets.OrderItemUnitQuantity.val() || 0);
                let numberOfCases = parseFloat(Widgets.OrderItemCaseQuantity.val() || 0);
                const textValue = Widgets.OrderItemItem.val() || null;
                const selectedOption = Widgets.OrderItemList.find(`option[value="${textValue}"]`);
                const caseQuantity = parseFloat(selectedOption.attr("data-lt-caseQunatity") || 0);
                let unitsToBeAdded = parseFloat(itemQuantity + numberOfCases * caseQuantity);

                Widgets.OrderItemTotalUnits.text(unitsToBeAdded);
                const availableUnits = parseFloat(Widgets.OrderItemAvailableUnits.text());

                Widgets.OrderItemDoBackOrder.prop("checked", true);
                Widgets.OrderItemDoNotBackOrder.prop("checked", false);
                if (unitsToBeAdded > availableUnits) {
                    Widgets.OrderItemBackOrderContainer.show();
                }
                else {
                    Widgets.OrderItemBackOrderContainer.hide();
                }
            };

            Widgets.OrderItemUnitQuantity.on('focusout', function () {
                if (Widgets.OrderItemUnitQuantity.val() && Widgets.OrderItemItem.val() && parseInt(Widgets.OrderItemUnitQuantity.val()) > 0) {
                    const textValue = Widgets.OrderItemItem.val() || null;

                    var salesEventTypeId = EventTypes.find(T => ['Sales Order'].indexOf(T.name) > -1).id;
                    const itemId = Widgets.OrderItemList.find(`option[value="${textValue}"]`).attr("data-lt-value");
                    console.log(itemId);
                    Widgets.GetPriceDetail({
                        AffiliateId: RetailerData.retailerAffiliate.id,
                        CountryId: RetailerData.retailerAffiliate.countryId,
                        EventTypeId: salesEventTypeId,
                        ItemId: itemId,
                        Quantity: Widgets.OrderItemUnitQuantity.val(),
                        FallbackPriceSource: 'Msrp'
                    }).done(result => Widgets.OrderItemUnitQuantityAmount.val(result.amount));

                    Widgets.CalculateQuantity();

                }

            });

            Widgets.OrderItemCaseQuantity.on('focusout', function () {
                if (Widgets.OrderItemCaseQuantity.val() && Widgets.OrderItemItem.val() && parseInt(Widgets.OrderItemCaseQuantity.val()) > 0) {
                    const textValue = Widgets.OrderItemItem.val() || null;

                    var salesEventTypeId = EventTypes.find(T => ['Sales Order'].indexOf(T.name) > -1).id;
                    const itemId = Widgets.OrderItemList.find(`option[value="${textValue}"]`).attr("data-lt-value");

                    Widgets.GetPriceDetail({
                        AffiliateId: RetailerData.retailerAffiliate.id,
                        CountryId: RetailerData.retailerAffiliate.countryId,
                        EventTypeId: salesEventTypeId,
                        ItemId: itemId,
                        Quantity: Widgets.OrderItemCaseQuantity.val(),
                        FallbackPriceSource: 'Msrp'
                    }).done(result => Widgets.OrderItemCaseQuantityAmount.val(result.caseAmount || result.amount));

                }
                Widgets.CalculateQuantity();


            });

            Widgets.OrderItemBoxSaveBtns =
                Widgets.OrderItemBox.find('.oe-add-item-add, .oe-add-item-add-more').on('click', function () {

                    console.log(Widgets.OrderItemItem.val());
                    var Btn = $(this);

                    var TBody = $(`.oe-items tbody`);
                    const textValue = Widgets.OrderItemItem.val() || null;
                    const selectedOption = Widgets.OrderItemList.find(`option[value="${textValue}"]`);
                    const itemId = selectedOption.attr("data-lt-value");
                    const itemType = selectedOption.attr("data-lt-itemType");
                    const itemCategory = selectedOption.attr("data-lt-itemCategory");
                    const itemCode = selectedOption.attr("data-lt-itemCode");
                    const itemDescription = selectedOption.attr("data-lt-itemDescription");
                    const itemAmountType = selectedOption.attr("data-lt-itemAmountType");
                    const caseQuantity = parseFloat(selectedOption.attr("data-lt-caseQunatity") || 0);


                    let itemQuantity = parseFloat(Widgets.OrderItemUnitQuantity.val() || 0);
                    let numberOfCases = parseFloat(Widgets.OrderItemCaseQuantity.val() || 0);
                    let unitsToBeAdded = parseFloat(Widgets.OrderItemTotalUnits.text());


                    var itemIndex = parseInt(Widgets.OrderItemBox.attr('data-lt-item-index'), 10);
                    const rowUniqueId = Widgets.OrderItemBox.attr('data-lt-row-uniqueid');


                    var Data = {
                        ItemId: parseInt(itemId, 10),
                        ItemCode: itemCode,
                        ItemDescription: itemDescription,
                        ItemAmountType: itemAmountType,
                        ItemQuantity: parseInt(itemQuantity, 10),
                        NumberOfCases: parseInt(numberOfCases, 10),
                        CaseItemQuantity: parseInt(Widgets.OrderItemCaseUnits.text()) * parseInt(numberOfCases, 10),
                        UnitsToBeAdded: unitsToBeAdded,
                        AvailableUnits: parseFloat(Widgets.OrderItemAvailableUnits.text()),
                        ItemType: itemType,
                        ItemCategory: itemCategory,
                        UnitPrice: parseFloat(Widgets.OrderItemUnitQuantityAmount.val()),
                        CasePrice: parseFloat(Widgets.OrderItemCaseQuantityAmount.val()),
                        CaseUnits: parseInt(Widgets.OrderItemCaseUnits.text()),
                        DoBackOrder: Widgets.OrderItemDoBackOrder.prop("checked"),

                    };

                    const uniqueId = U.GenerateUniqueString();

                    //<td data-label="ItemCategory">${Data.ItemCategory || ''}</td>
                    var RowHTML = "";
                    if (Data.ItemQuantity > 0) {
                        RowHTML = `<tr data-lt-uniqueId="${uniqueId}" class="new-itemAdd individual-item" data-lt-model="${encodeURIComponent(JSON.stringify(Data))}">
                            <td data-label="ItemType">${Data.ItemType || ''}</td>
                            <td data-label="SKU Number">${Data.ItemCode || ''}</td>
                            <td data-label="Description">${Data.ItemDescription || ''}</td>
                            <td data-label="QTY">${Data.ItemQuantity}</td>
                            <td data-label="Unit Price">$${Data.UnitPrice.toFixed(2)}</td>
                            <td data-label="Total">$${U.PrepMathForView(U.PrepMoneyForMath(Data.UnitPrice) * U.PrepMoneyForMath(Data.ItemQuantity), 1)}</td>
                            <td data-label="Edit"><i class="fa fa-pencil-alt EditItem" style="cursor: pointer;"></i></td>
                            <td data-label="Delete"><i class="fa fa-trash-alt RemoveItem" style="cursor: pointer;"></i></td>
                        </tr>`;
                    }
                    var caseRowHTML = "";
                    if (Data.NumberOfCases > 0) {
                        caseRowHTML =
                            `<tr data-lt-uniqueId="${uniqueId}" class="new-itemAdd case-item" data-lt-model="${encodeURIComponent(JSON.stringify(Data))}">
                            <td data-label="ItemType">${Data.ItemType || ''}</td>
                            <td data-label="SKU Number">${Data.ItemCode || ''}</td>
                            <td data-label="Description">(${Data.NumberOfCases} cases)-${Data.ItemDescription || ''}</td>
                            <td data-label="QTY">${Data.CaseItemQuantity}</td>
                            <td data-label="Unit Price">$${Data.CasePrice.toFixed(2)}</td>
                            <td data-label="Total">$${U.PrepMathForView(U.PrepMoneyForMath(Data.CasePrice) * U.PrepMoneyForMath(Data.CaseItemQuantity), 1)}</td>
                            <td data-label="Edit"><i class="fa fa-pencil-alt EditItem" style="cursor: pointer;"></i></td>
                            <td data-label="Delete"><i class="fa fa-trash-alt RemoveItem" style="cursor: pointer;"></i></td>
                        </tr>`;
                    }

                    if (U.IsNumber(itemIndex) && TBody.find(`tr.individual-item[data-lt-uniqueId="${rowUniqueId}"]`).length) {
                        TBody.find(`tr.individual-item[data-lt-uniqueId="${rowUniqueId}"]`).replaceWith(RowHTML); // edit

                    } else {
                        $(RowHTML).appendTo(TBody); // add
                    }

                    if (U.IsNumber(itemIndex) && TBody.find(`tr.case-item[data-lt-uniqueId="${rowUniqueId}"]`).length) {
                        TBody.find(`tr.case-item[data-lt-uniqueId="${rowUniqueId}"]`).replaceWith(caseRowHTML); // edit
                    } else {
                        $(caseRowHTML).appendTo(TBody); // add
                    }

                    Widgets.OrderItemBox.addClass('non-visible').removeAttr('data-lt-item-index').removeAttr('data-lt-row-uniqueid');

                    if (Btn.hasClass('oe-add-item-add-more')) {
                        Widgets.OrderAddItemsButton.trigger('click');
                    }
                    Widgets.FormValidation();
                    Widgets.UpdateOrderTotal();


                });

            var FormElems = $('input:required, select:required', '.order-entry-container');
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

                console.log(Widgets.OrderItemsTable.find('tr.new-itemAdd').length);
                Valid && Widgets.OrderItemsTable.find('tr.new-itemAdd').length
                    ? Widgets.OrderEntrySubmitButton.css('background', '').prop('disabled', false)
                    : Widgets.OrderEntrySubmitButton.css('background', '#d9d8d6').prop('disabled', true);
            };
            FormElems.first().trigger('change');

            Widgets.UpdateOrderTotal = function () {
                let totalOrder = 0;
                Widgets.OrderItemsTable.find('.new-itemAdd').each(function () {
                    var TR = $(this);
                    const model = JSON.parse(decodeURIComponent(TR.attr('data-lt-model')));
                    console.log(model);
                    if (TR.hasClass("case-item"))
                        console.log(parseFloat(model.CasePrice) * parseFloat(model.CaseItemQuantity));
                    else console.log(parseFloat(model.UnitPrice) * parseFloat(model.ItemQuantity));
                    totalOrder += TR.hasClass("case-item") ?
                        parseFloat(model.CasePrice) * parseFloat(model.CaseItemQuantity) :
                        parseFloat(model.UnitPrice) * parseFloat(model.ItemQuantity);
                });
                Widgets.OrderItemsTotal.html(totalOrder.toFixed(2));

            };

            // Create Order
            Widgets.SubmitOrder = function () {

                var mainPromise = new $.Deferred();

                //mainPromise.resolve("1255445646");


                Widgets.AddEvent().then(function (eventid) {
                    $.when(Widgets.AddEventItems(eventid), Widgets.AddShippingInstruction(eventid)).done((eventitems, cid) => {
                        console.log(eventitems);
                        console.log(cid);
                        mainPromise.resolve(eventid);
                    });
                });

                return mainPromise;

            };

            Widgets.AddEvent = function () {
                var Promise = new $.Deferred();
                var EventType = EventTypes.find(T => ['Sales Order'].indexOf(T.name) > -1).name;
                var Route = null;
                var Data = {
                    CustomColumns: [],
                    ReviewStatus: 0,
                    Tag1: Widgets.OrderEntryPoRef.val(),
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

            Widgets.AddEventItems = function (EventId) {
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
                let shipViaCode = Widgets.OrderEntryExpeditedShipping.prop("checked") ? ExpeditedShipViaCode : DefaultShipViaCode;
                Widgets.OrderItemsTable.find('.new-itemAdd').each(function () {
                    var TR = $(this);
                    const model = JSON.parse(decodeURIComponent(TR.attr('data-lt-model')));
                    const quantity = TR.hasClass("case-item") ? model.CaseItemQuantity : model.ItemQuantity;
                    var itemData = {
                        ItemId: model.ItemId,
                        Quantity: TR.hasClass("case-item") ? model.CaseItemQuantity : model.ItemQuantity,
                        CustomerUnitAmount: TR.hasClass("case-item") ? model.CasePrice : model.UnitPrice,
                        Description: model.ItemDescription || null,
                        ShipFromLocationId: RetailerData.retailerAffiliate.locationId,
                        ShipToLocationId: Widgets.Store.find('option:selected').val(),
                        ShipViaId: model.ShipViaId || ShipViaList.find(x => x.code === shipViaCode) ? ShipViaList.find(x => x.code === shipViaCode).id : Widgets.OrderEntryExpeditedShipping.prop("checked") ? ShipViaList[1].id : ShipViaList[0].id,
                        ShipTermId: model.ShipTermId || null,
                        CarrierAccountNumber: model.CarrierAccountNumber || null,
                        AutoStockBehaviour: model.AutoStockBehaviour || 'Standard',
                        FlowControl: model.FlowControl || 'AutoReserve',
                        AmountType: model.ItemAmountType,
                        DiscountPercentage: model.DiscountPercentage || 0,
                        ClientIdentifier: model.ClientIdentifier || U.GenerateUniqueString(),
                        ActionTime: Widgets.OrderEntryShipAfterDate.val() ? Widgets.OrderEntryShipAfterDate.val().trim() : undefined

                    };
                    Data.Items.push(itemData);
                });



                $.when(U.AJAX(Route, 'POST', Data, false, 'normal', true))
                    .then(function (Results) {
                        Promise.resolve(Results);
                    });
                return Promise;
            };

            Widgets.AddShippingInstruction = function (EventId) {
                let shippingInstruction = Widgets.OrderEntryShippingInstruction.val();
                var Promise = new $.Deferred();


                if (shippingInstruction) {
                    return U.AJAX(
                        `/API/Core/CreateConversation/Event/${EventId}/${PublicConversationType.id}/-1`, 'POST',
                        { text: shippingInstruction },
                        false, 'silent', true
                    ).then(CId => Promise.resolve(CId));

                }
                else {
                    Promise.resolve(0);
                }

                return Promise;
            };

            Widgets.OrderEntrySubmitButton.on('click', function () {

                let orderItemsTotalAmount = parseFloat(Widgets.OrderItemsTotal.text());
                let tax = (orderItemsTotalAmount * 0.13);
                let grandTotal = orderItemsTotalAmount + tax;

                Widgets.PaymentPlaceOrderButton.css('background', '#d9d8d6').prop('disabled', true);
                Widgets.PaymentOrderTotal.text(Widgets.OrderItemsTotal.text());
                Widgets.PaymentOrderFreightAmount.text("0.00");
                Widgets.PaymentOrderTaxAmount.text(tax.toFixed(2));
                Widgets.PaymentOrderGrandTotalAmount.text((orderItemsTotalAmount + tax).toFixed(2));
                Widgets.PaymentRewardRedemptionAmount.text('0');

                const rewardsAmount = parseFloat(Widgets.PaymentRewardRedemptionAmount.text());
                const orderTotal = parseFloat(Widgets.PaymentOrderGrandTotalAmount.text());
                Widgets.PaymentNetAmount.text(parseFloat(orderTotal - rewardsAmount).toFixed(2));
                Widgets.RenderPaymentOptions();
                Widgets.PaymentModalBox.removeClass('non-visible');

                //$.when(Widgets.SubmitOrder()).done(() => { console.log("SubmitOrder"); Widgets.ResetScreen(); });
            });

            Widgets.OrderEntryRemoveOrderButton.on('click', function () {
                Widgets.ResetScreen();
            });

            Widgets.ResetScreen = function () {
                Widgets.OrderItemsTable.find('.new-itemAdd').each(function () {
                    var TR = $(this);
                    TR.find(".RemoveItem").trigger('click');
                });
                Widgets.Store.val("").change();
                Widgets.OrderEntryPoRef.val("");
                Widgets.OrderEntryExpeditedShipping.prop("checked", false);
                Widgets.OrderEntryShipAfterDate.val("").change();
                //Widgets.OrderItemsTotal.html(totalOrder.toFixed(2));
            };

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
                        Widgets.MakePayment(orderId).done(R => {
                            $.when(Widgets.AddEventItems(orderId), Widgets.AddShippingInstruction(orderId)).done((eventitems, cid) => {
                                console.log(eventitems);
                                console.log(cid);
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
                                    cardId: R.affiliateLocationId,
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

            U.ShowUI();

        });
    });

})();
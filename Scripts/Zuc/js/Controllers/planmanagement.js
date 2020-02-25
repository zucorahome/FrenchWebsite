/*

    planmanagement Controller for the View "planmanagement"
    Copyright 2020, LimeTAC Inc. All rights reserved.

*/

LT.PlanManagement = function (Config) {

    if (!Config) Config = {};
    var U = new LTPublicUtils();
    var Outer = $('#plan-management');
    var Widgets = {};

    $.when(
        LT.LTCodes.Get('EquipmentTypeStatusOptions'),
        LT.LTCodes.Get('NonConveyanceEquipmentTypes').then(R => R.sort((A, B) => A.code.toUpperCase() > B.code.toUpperCase() ? 1 : A.code.toUpperCase() < B.code.toUpperCase() ? -1 : 0)),
        (Config.RetailerData ? new $.Deferred().resolve(Config.RetailerData) : U.AJAX('/API/Core/GetRetailerDatas', 'GET', false, false, 'silent').then(R => R))
    ).done(function (EqTypeStatuses, EquipmentTypes, RetailerData) {
        $(function () {

            Widgets.Store = $('select[name="store-location"]', Outer);
            if (RetailerData.locations != null) {
                RetailerData.locations.forEach(L => { if (L.isActive) Widgets.Store.append(`<option value="${L.id}">${L.name}</option>`) });
                Widgets.Store.on('change', function () {
                    var Val = $(this).val() || null;
                    Widgets.Associate.find('option:gt(0)').remove();
                    if (Val) {
                        (RetailerData.associates || []).forEach(A => {
                            if (A.locationId == Val) {
                                Widgets.Associate.append('<option value="' + A.id + '">' + A.fullName + '</option>');
                            }
                        });
                    }
                    Widgets.Associate.trigger('LTOptionsUpdated');
                });
            }
            Widgets.OrderInvoiceRef = $('input[name="order-number"]', Outer);
            Widgets.Associate = $('select[name="advisor"]', Outer);
            Widgets.SaleDateField = $('input[name="sale-date"]', Outer);
            var Sixty = new Date();
            Sixty.setHours(0, 0, 0, 0);
            Sixty.setDate(Sixty.getDate() + 60);
            Widgets.EstDeliveryField =
                $('input[name="est-delivery-date"]', Outer).on('change', function () {
                    var Val = Widgets.EstDeliveryField.val();
                    if (Val) {
                        Val = Val.split('-');
                        var Sel = new Date(Val[0], Val[1] - 1, Val[2], 0, 0, 0, 0);
                        if (Sel.getTime() > Sixty.getTime()) {
                            Widgets.EstDeliveryField.val('');
                        }
                    }
                });
            Widgets.EstDeliveryField.attr('max', `${Sixty.getFullYear()}-${('0' + (Sixty.getMonth() + 1)).slice(-2)}-${('0' + Sixty.getDate()).slice(-2)}`);
            Widgets.EstDeliveryInfoText = $('.info-text-container', Outer);
            Widgets.EstDeliveryInfoCircle =
                $('.info-circle', Outer)
                    .on('mouseover', () => { Widgets.EstDeliveryInfoText.show() })
                    .on('mouseout', () => { Widgets.EstDeliveryInfoText.hide() });
            Widgets.CustomerFirstName = $('input[name="cust-first-name"]', Outer);
            Widgets.CustomerLastName = $('input[name="cust-last-name"]', Outer);
            Widgets.CustomerPhone = $('input[name="customer-phone"]', Outer);
            Widgets.CustomerEmail = $('input[name="customer-email"]', Outer);
            Widgets.CustomerPhone.on("keypress", function (evt) {
                if (evt.which < 48 || evt.which > 57) {
                    evt.preventDefault();
                }
            });
            Widgets.CustomerPhone.attr("maxlength", "10");
            Widgets.RateCard = $('select[name="rate-card"]', Outer);
            if (RetailerData.rateCards != null) {
                RetailerData.rateCards.forEach(C => Widgets.RateCard.append('<option value="' + C.id + '">' + C.code + '</option>'));
            }
            Widgets.RateCard.on('change', function () {
                Widgets.SKU.find('option:gt(0)').remove();
                var Val = parseInt($(this).val(), 10) || null;
                if (Val) {
                    U.AJAX('/API/Core/GetSKU/' + Val, 'GET', false, false, 'silent').then(function (R) {
                        R.skuDatas
                            .sort((A, B) => A.code.toUpperCase() > B.code.toUpperCase() ? 1 : A.code.toUpperCase() < B.code.toUpperCase() ? -1 : 0)
                            .forEach(D => Widgets.SKU.append(`<option value="${D.id}" data-lt-plan-retail-price="${D.price}">${D.code}</option>`));
                        Widgets.SKU.trigger('LTOptionsUpdated');
                    });
                }
            });
            Widgets.SKU = $('select[name="sku"]', Outer);
            Widgets.PlanRegistrationBox = $('.plan-registration-box', Outer);
            function GetPlanPrice() {
                var SKUId = Widgets.SKU.val() || null;
                var LocId = Widgets.Store.val() || null;
                if (SKUId && LocId) {
                    var $Price = $('.sku-price', Outer);
                    var IsVariable = parseInt($Price.attr('data-lt-is-variable') || '-1', 10);
                    var BasePrice = function () {
                        if (IsVariable === 1) { // it's variable
                            return $('td[data-label="Total"]', Outer)
                                .get()
                                .reduce(
                                    (A, C) => A + parseFloat(C.innerHTML.replace(/[^0-9.]/g, '')),
                                    0
                                );
                        } else if (IsVariable === 0) { // it's NOT variable
                            return null;
                        } else if (IsVariable === -1) { // we don't know yet
                            return 0;
                        }
                    }();
                    return (
                        $Price.length && IsVariable !== 1
                            ? new $.Deferred().resolve({ price: { amount: parseFloat($Price.text()), isVariable: !!IsVariable } })
                            : U.AJAX(`/API/Core/GetRetailerMSRP/${LocId}/${SKUId}/${BasePrice}/`)
                    ).then(R => R.price);
                }
                return new $.Deferred().resolve(null);
            }
            Widgets.AddPlanBtn =
                $('.addPlanButton', Outer).on('click', function () {
                    Widgets.AddPlanBtn.css('background', '#d9d8d6').prop('disabled', true);
                    Widgets.PlanRegistrationBox.show(1000);
                    $('html').animate({ scrollTop: 640 }, 'slow');
                    Widgets.SubmitBtn.css('background', '#d9d8d6').prop('disabled', true);
                    Widgets.RateCard.prop('disabled', true);
                    Widgets.SKU.prop('disabled', true);
                    var SelectedSKU = Widgets.SKU.find('option:selected');
                    GetPlanPrice().then(R => {
                        $(
                            `<div class="new-planAdd" data-lt-sku-id="${Widgets.SKU.val()}">
                                <div class="new-planAdd-title flex flex-row flex-vert-center flex-hor-between">
                                    <p>
                                        <span class="sku">${SelectedSKU.text()}</span>
                                        - Cost:
                                        $ <span class="sku-price" data-lt-is-variable="${R.isVariable ? 1 : 0}">${R.amount.toFixed(2)}</span>
                                    </p>
                                    <button class="zuc-btn zuc-btn-secondary zuc-btn-xpad u-soft-shadow addItemModal-button">Add item</button>
                                </div>
                                <div class="new-planAdd-detail">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th scope="col" style="width:7%;">Product</th>
                                                <th scope="col" style="width:5%;">QTY</th>
                                                <th scope="col">Description</th>
                                                <th scope="col">SKU Number</th>
                                                <th scope="col">Manufacturer</th>
                                                <th scope="col">Serial NBR</th>
                                                <th scope="col">Unit Price</th>
                                                <th scope="col">Total</th>
                                                <th scope="Edit" style="width:5%;"></th>
                                                <th scope="Delete" style="width:5%;"></th>
                                            </tr>
                                        </thead>
                                        <tbody></tbody>
                                    </table>
                                </div>
                            </div>`
                        ).appendTo(Widgets.PlanRegistrationBox);
                        if (!R.isVariable) {
                            Widgets.SubmitBtn.css('background', '').prop('disabled', false);
                        }
                    });
                });
            Widgets.PlanItemBox = $('.addItem-modal', Outer);
            function CascadeProductTypeFromEquipmentType(ProductTypeId) {
                Widgets.PlanItemProductType.val('').prop('disabled', true).closest('.planRegis-divStyle').addClass('grey-field');
                Widgets.PlanItemProductType.find('option:gt(0)').remove();
                var Val = Widgets.PlanItemEquipmentType.val() || null;
                if (Val) {
                    U.AJAX('/API/FieldService/GetProductTypeByEquipmentType/' + Val, 'GET', false, false, 'silent')
                        .then(R => {
                            R.forEach(T => Widgets.PlanItemProductType.append(`<option value="${T.id}">${T.code}</option>`));
                            Widgets.PlanItemProductType.prop('disabled', false).closest('.planRegis-divStyle').removeClass('grey-field');;
                            if (ProductTypeId && Widgets.PlanItemProductType.find(`option[value="${ProductTypeId}"]`).length) {
                                Widgets.PlanItemProductType.val(ProductTypeId).trigger('change');
                            }
                        });
                }
            }
            Widgets.PlanItemEquipmentType =
                Widgets.PlanItemBox.find('select[name="equipment-type"]').on('change', function () {
                    CascadeProductTypeFromEquipmentType();
                });
            Widgets.PlanItemProductType = Widgets.PlanItemBox.find('select[name="product-type"]');
            Widgets.PlanItemDescription = Widgets.PlanItemBox.find('input[name="description"]');
            Widgets.PlanItemManufacturer = Widgets.PlanItemBox.find('input[name="manufacturer"]');
            Widgets.PlanItemModel = Widgets.PlanItemBox.find('input[name="model"]');
            Widgets.PlanItemSerial = Widgets.PlanItemBox.find('input[name="serial-number"]');
            Widgets.PlanItemQuantity = Widgets.PlanItemBox.find('input[name="quantity"]');
            Widgets.PlanItemPrice = Widgets.PlanItemBox.find('input[name="pricePer-item"]');
            Widgets.PlanItemBox.on('click', '.button-minus, .button-plus', function () {
                var Qty = parseInt(Widgets.PlanItemQuantity.val().trim(), 10) || 1;
                $(this).hasClass('button-minus') ? Qty-- : Qty++;
                if (Qty < 1) Qty = 1;
                Widgets.PlanItemQuantity.val(Qty);
            });
            EquipmentTypes.forEach((function () {
                var ActiveEqTypeStatusId = EqTypeStatuses.find(S => S.code == 'Active').id;
                return T => {
                    if (T.status == ActiveEqTypeStatusId) {
                        Widgets.PlanItemEquipmentType.append('<option value="' + T.id + '">' + T.code + '</option>');
                    }
                };
            })());
            Widgets.PlanRegistrationBox
                .on('click', '.addItemModal-button', function () {
                    var Btn = $(this);
                    var SKUId = Btn.closest('.new-planAdd').attr('data-lt-sku-id');
                    Widgets.PlanItemBox.removeClass('non-visible').attr('data-lt-sku-id', SKUId);
                    Widgets.PlanItemBox.find('input:not(.qty-button), select').val('').trigger('change');
                    Widgets.PlanItemQuantity.val(1);
                })
                .on('click', '.EditEquipment', function () {
                    var Icon = $(this);
                    var TR = Icon.closest('tr');
                    var SKUId = Icon.closest('.new-planAdd').attr('data-lt-sku-id');
                    var Model = JSON.parse(decodeURIComponent(TR.attr('data-lt-model')));
                    Widgets.PlanItemBox.removeClass('non-visible').attr('data-lt-sku-id', SKUId).attr('data-lt-equipment-index', TR.index());
                    Widgets.PlanItemEquipmentType.val(Model.equipmentTypeId);
                    CascadeProductTypeFromEquipmentType(Model.productTypeId);
                    Widgets.PlanItemDescription.val(Model.description);
                    Widgets.PlanItemManufacturer.val(Model.manufacturer);
                    Widgets.PlanItemModel.val(Model.model);
                    Widgets.PlanItemSerial.val(Model.code);
                    Widgets.PlanItemQuantity.val(Model.quantity);
                    Widgets.PlanItemPrice.val(Model.price.toFixed(2));
                })
                .on('click', '.RemoveEquipment', function () {
                    var Btn = $(this);
                    var Row = Btn.closest('tr');
                    var SiblingCount = Row.siblings().length;
                    Row.remove();
                    GetPlanPrice().then(R => {
                        $('.sku-price', Outer).text(R.amount.toFixed(2));
                        !R.isVariable || SiblingCount > 0
                            ? Widgets.SubmitBtn.css('background', '').prop('disabled', false)
                            : Widgets.SubmitBtn.css('background', '#d9d8d6').prop('disabled', true);
                    });
                });
            Widgets.PlanItemBoxSaveBtns =
                Widgets.PlanItemBox.find('.addItem-save, .addItem-saveAndAdd').on('click', function () {
                    var Btn = $(this);
                    var SKUId = Widgets.PlanItemBox.attr('data-lt-sku-id');
                    var TBody = Widgets.PlanRegistrationBox.find(`.new-planAdd[data-lt-sku-id="${SKUId}"] .new-planAdd-detail table tbody`);
                    var EqIndex = parseInt(Widgets.PlanItemBox.attr('data-lt-equipment-index'), 10);
                    var Data = {
                        equipmentTypeId: parseInt(Widgets.PlanItemEquipmentType.val(), 10),
                        equipmentType: Widgets.PlanItemEquipmentType.find('option:selected').text(),
                        productTypeId: parseInt(Widgets.PlanItemProductType.val(), 10),
                        productType: Widgets.PlanItemProductType.find('option:selected').text(),
                        description: Widgets.PlanItemDescription.val().trim() || null,
                        manufacturer: Widgets.PlanItemManufacturer.val().trim() || null,
                        model: Widgets.PlanItemModel.val().trim() || null,
                        code: Widgets.PlanItemSerial.val().trim().substr(0, 40) || null,
                        quantity: Math.max(parseInt(Widgets.PlanItemQuantity.val().trim() || 0, 10), 1),
                        price: parseFloat(Widgets.PlanItemPrice.val().trim()),
                    };
                    var RowHTML =
                        `<tr data-lt-model="${encodeURIComponent(JSON.stringify(Data))}">
                            <td data-label="Product">${Data.productType || ''}</td>
                            <td data-label="QTY">${Data.quantity}</td>
                            <td data-label="Description">${Data.description || ''}</td>
                            <td data-label="SKU Number">${Data.model || ''}</td>
                            <td data-label="Manufacturer">${Data.manufacturer || ''}</td>
                            <td data-label="Serial NBR">${Data.code || ''}</td>
                            <td data-label="Unit Price">$${Data.price.toFixed(2)}</td>
                            <td data-label="Total">$${U.PrepMathForView(U.PrepMoneyForMath(Data.price) * U.PrepMoneyForMath(Data.quantity), 1)}</td>
                            <td data-label="Edit"><i class="fa fa-pencil-alt EditEquipment" style="cursor: pointer;"></i></td>
                            <td data-label="Delete"><i class="fa fa-trash-alt RemoveEquipment" style="cursor: pointer;"></i></td>
                        </tr>`;
                    U.IsNumber(EqIndex)
                        ? TBody.find(`tr:eq(${EqIndex})`).replaceWith(RowHTML) // edit
                        : $(RowHTML).appendTo(TBody); // add
                    TBody.closest('.new-planAdd-detail').show();
                    Widgets.PlanItemBox.addClass('non-visible').removeAttr('data-lt-sku-id').removeAttr('data-lt-equipment-index');
                    Widgets.PlanItemBox.find('input:not(.qty-button), select').val('').trigger('change');
                    GetPlanPrice().then(R => {
                        $('.sku-price', Outer).text(R.amount.toFixed(2));
                        Widgets.SubmitBtn.css('background', '').prop('disabled', false);
                    });
                    if (Btn.hasClass('addItem-saveAndAdd')) {
                        Widgets.PlanRegistrationBox.find(`.new-planAdd[data-lt-sku-id="${SKUId}"] .addItemModal-button`).trigger('click');
                    }
                });

            var EquipmentFormElems = $('input:not([type="hidden"]), select:not([type="hidden"])', Widgets.PlanItemBox);
            EquipmentFormElems.on('change', function () {
                var Valid = true;
                EquipmentFormElems.each(function () {
                    if (!$(this)[0].validity.valid) {
                        Valid = false;
                        return false;
                    }
                });
                Valid
                    ? Widgets.PlanItemBoxSaveBtns.css('background', '').prop('disabled', false)
                    : Widgets.PlanItemBoxSaveBtns.css('background', '#d9d8d6').prop('disabled', true);
            });

            Widgets.CongratulationsBox =
                $('.mainSubmit-modal-container', Outer).on('click', '.cross, .close-modal', function () {
                    Widgets.CongratulationsBox.addClass('non-visible');
                    Widgets.CongratulationsBox.find('.customer-name, .customer-email').text('');
                    if (!IsRegistration) {
                        Outer.siblings('.close-modal').first().trigger('click');
                        if (Config.SearchBtns) Config.SearchBtns.first().trigger('click');
                    }
                    Widgets.ClearBtn.trigger('click');
                    if (IsRegistration) {
                        Widgets.Store.val(Widgets.Store.attr('data-lt-previous-value'));
                        Widgets.Associate.html(decodeURIComponent(Widgets.Associate.attr('data-lt-previous-options')));
                        Widgets.Associate.val(Widgets.Associate.attr('data-lt-previous-value'));
                        Widgets.RateCard.val(Widgets.RateCard.attr('data-lt-previous-value')).trigger('change');
                    }
                });
            Widgets.SubmitBtn =
                $('.planRegis-mainSubmit-button', Outer).on('click', function () {
                    var PlanEq = [];
                    Widgets.PlanRegistrationBox.find('.new-planAdd').each(function () {
                        var PUI = $(this);
                        var SKUId = parseInt(PUI.attr('data-lt-sku-id'), 10);
                        PlanEq.push({
                            PlanId: SKUId,
                            PlanPrice: parseFloat(PUI.find('.sku-price').text()),
                            Equipment: $.map(
                                Widgets.PlanRegistrationBox.find(`.new-planAdd[data-lt-sku-id="${SKUId}"] .new-planAdd-detail table tbody tr`),
                                Elem => {
                                    var Model = JSON.parse(decodeURIComponent($(Elem).attr('data-lt-model')));
                                    delete Model.equipmentType;
                                    delete Model.productType;
                                    return Model;
                                }
                            ),
                        });
                    });
                    var CustomerFirstName = Widgets.CustomerFirstName.val().trim();
                    var CustomerLastName = Widgets.CustomerLastName.val().trim();
                    var CustomerEmail = Widgets.CustomerEmail.val().trim();
                    LT.LTCodes.Get('EventTypes')
                        .then(ETs => {
                            var PPETId = ETs.find(T => T.name == 'Protection Plan').id;
                            return U.AJAX(
                                IsRegistration
                                    ? '/API/Core/CreateRetailerAgreement'
                                    : '/API/Core/EditRetailerAgreement',
                                'POST',
                                {
                                    retailerEventId: !IsRegistration ? Outer.closest('.planRegistration-modal-container').attr('data-lt-plan-id') : undefined,
                                    locationId: parseInt(Widgets.Store.val(), 10),
                                    associateId: parseInt(Widgets.Associate.val(), 10),
                                    firstName: CustomerFirstName,
                                    lastName: CustomerLastName,
                                    phoneNumber: Widgets.CustomerPhone.val().replace(/[^0-9]g/, ''),
                                    email: CustomerEmail,
                                    eventTypeId: PPETId,
                                    orderinvNumber: Widgets.OrderInvoiceRef.val().trim(),
                                    skuId: PlanEq[0].PlanId,
                                    saleDate: Widgets.SaleDateField.val().trim(),
                                    estimatedLastDeliveryDate: Widgets.EstDeliveryField.val().trim(),
                                    suggestedPrice: PlanEq[0].PlanPrice,
                                    equipments: PlanEq[0].Equipment,
                                    rateCard: parseInt(Widgets.RateCard.val(), 10),
                                },
                                false, 'normal', true
                            );
                        })
                        .then(() => {
                            Widgets.CongratulationsBox.find('.customer-name').text(CustomerFirstName + ' ' + CustomerLastName);
                            Widgets.CongratulationsBox.find('.customer-email').text(CustomerEmail);
                            Widgets.CongratulationsBox.removeClass('non-visible');
                        });
                });
            Widgets.SubmitBtn.closest('.planRegis-controls').css('visibility', 'visible');
            Widgets.SameAsPreviousDataBtn =
                $('.fillForm-button', Outer).on('click', function () {
                    $('[data-lt-previous-value]', Outer).each(function () {
                        var Elem = $(this);
                        if (Elem.is('[data-lt-previous-options]')) {
                            Elem.html(decodeURIComponent(Elem.attr('data-lt-previous-options')));
                        }
                        Elem.val(Elem.attr('data-lt-previous-value'));
                    });
                    Widgets.SKU.trigger('change');
                }).hide();
            Widgets.ClearBtn =
                $('.clearform-button', Outer).on('click', function () {
                    Widgets.Store.attr('data-lt-previous-value', Widgets.Store.val() || '');
                    Widgets.Store.val('');
                    Widgets.OrderInvoiceRef.attr('data-lt-previous-value', Widgets.OrderInvoiceRef.val() || '');
                    Widgets.OrderInvoiceRef.val('');
                    Widgets.SaleDateField.attr('data-lt-previous-value', Widgets.SaleDateField.val() || '');
                    Widgets.SaleDateField.val('');
                    Widgets.EstDeliveryField.attr('data-lt-previous-value', Widgets.EstDeliveryField.val() || '');
                    Widgets.EstDeliveryField.val('');
                    Widgets.Associate.attr('data-lt-previous-value', Widgets.Associate.val() || '');
                    Widgets.Associate.attr('data-lt-previous-options', encodeURIComponent(Widgets.Associate.html() || ''));
                    Widgets.Associate.val('');
                    Widgets.CustomerEmail.attr('data-lt-previous-value', Widgets.CustomerEmail.val() || '');
                    Widgets.CustomerEmail.val('');
                    Widgets.CustomerFirstName.attr('data-lt-previous-value', Widgets.CustomerFirstName.val() || '');
                    Widgets.CustomerFirstName.val('');
                    Widgets.CustomerLastName.attr('data-lt-previous-value', Widgets.CustomerLastName.val() || '');
                    Widgets.CustomerLastName.val('');
                    Widgets.CustomerPhone.attr('data-lt-previous-value', Widgets.CustomerPhone.val() || '');
                    Widgets.CustomerPhone.val('');
                    Widgets.SKU.attr('data-lt-previous-value', Widgets.SKU.val() || '');
                    Widgets.SKU.attr('data-lt-previous-options', encodeURIComponent(Widgets.SKU.html() || ''));
                    Widgets.SKU.val('');
                    Widgets.RateCard.attr('data-lt-previous-value', Widgets.RateCard.val() || '');
                    Widgets.RateCard.val('').trigger('change');
                    Widgets.RateCard.css('background', '').prop('disabled', false);
                    Widgets.SKU.css('background', '').prop('disabled', false);
                    $('.new-planAdd', Outer).remove();
                    Widgets.PlanRegistrationBox.hide(500);
                    $('html').animate({ scrollTop: 0 }, 'fast');
                    Widgets.SameAsPreviousDataBtn.show();
                });

            var FormElems = $('input:required, select:required', Outer.find('.planRegis-form-container'));
            FormElems.on('change', function () {
                var Valid = true;
                FormElems.each(function () {
                    if (!$(this)[0].validity.valid) {
                        Valid = false;
                        return false;
                    }
                });
                Valid && !Widgets.PlanRegistrationBox.find('.new-planAdd').length
                    ? Widgets.AddPlanBtn.css('background', '').prop('disabled', false)
                    : Widgets.AddPlanBtn.css('background', '#d9d8d6').prop('disabled', true);
                Valid && Widgets.PlanRegistrationBox.find('.new-planAdd').length
                    ? Widgets.SubmitBtn.css('background', '').prop('disabled', false)
                    : Widgets.SubmitBtn.css('background', '#d9d8d6').prop('disabled', true);
            });
            FormElems.first().trigger('change');

            if (IsRegistration) U.ShowUI();

        });
    });

    return Widgets;

};
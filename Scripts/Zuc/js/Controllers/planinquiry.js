/*

    planinquiry Controller for the View "planinquiry"
    Copyright 2019, LimeTAC Inc. All rights reserved.

*/

(function () {

    var U = new LTPublicUtils();

    $.when(
        LT.LTCodes.Get('EquipmentTypeStatusOptions'),
        LT.LTCodes.Get('NonConveyanceEquipmentTypes').then(R => R.sort((A, B) => A.code.toUpperCase() > B.code.toUpperCase() ? 1 : A.code.toUpperCase() < B.code.toUpperCase() ? -1 : 0)),
        LT.LTCodes.Get('ProtectionPlanProgressStatusOptions'),
        LT.LTCodes.Find('ConversationTypes', 'code', 'Internal'),
        U.AJAX('/API/Core/GetRetailerDatas', 'GET', false, false, 'silent').then(R => R)
    ).done(function (EqTypeStatuses, EquipmentTypes, ProgressStatuses, InternalConvType, RetailerData) {
        $(function () {

            var Widgets = {};
            
            Widgets.SubmitDateStartFilter =
                $('input[name="inquiry-date-from"]').on('blur', function () {
                    var Val = Widgets.SubmitDateStartFilter.val();
                    if (Val.length != 10) {
                        Widgets.SubmitDateStartFilter.val('');
                    }
                });
            Widgets.SubmitDateEndFilter =
                $('input[name="inquiry-date-to"]').on('blur', function () {
                    var Val = Widgets.SubmitDateStartFilter.val();
                    if (Val.length != 10) {
                        Widgets.SubmitDateStartFilter.val('');
                    }
                });
            var Sixty = new Date();
            Sixty.setHours(0, 0, 0, 0);
            Sixty.setDate(Sixty.getDate() + 60);
            Widgets.SubmitDateEndFilter.on('change', function () {
                var Val = Widgets.SubmitDateStartFilter.val();
                if (Val) {
                    Val = Val.split('-');
                    var Sel = new Date(Val[0], Val[1] - 1, Val[2], 0, 0, 0, 0);
                    if (Sel.getTime() > Sixty.getTime()) {
                        Widgets.SubmitDateEndFilter.val('');
                    }
                }
            });
            Widgets.SubmitDateEndFilter.attr('max', `${Sixty.getFullYear()}-${('0' + (Sixty.getMonth() + 1)).slice(-2)}-${('0' + Sixty.getDate()).slice(-2)}`);
            Widgets.ProgressStatusFilter =
                $('.filter-status').on('click', 'p', function () {
                    $(this).addClass('selected').siblings().removeClass('selected');
                });
            ProgressStatuses.forEach(S => Widgets.ProgressStatusFilter.append(`<p data-lt-value="${S.id}">${S.code}</p>`));
            Widgets.StoreFilter =
                $('.filter-store').on('click', 'p', function () {
                    $(this).addClass('selected').siblings().removeClass('selected');
                });
            if (RetailerData.locations != null) {
                RetailerData.locations.forEach(L => Widgets.StoreFilter.append(`<p data-lt-value="${L.id}">${L.name}</p>`));
            }
            Widgets.AssociateFilter =
                $('.filter-associate').on('click', 'p', function () {
                    $(this).addClass('selected').siblings().removeClass('selected');
                });
            if (RetailerData.associates != null) {
                RetailerData.associates
                    .reduce(
                        (A, Affl) => {
                            if (!A.find(Affl2 => Affl2.id == Affl.id)) {
                                A.push(Affl);
                            }
                            return A;
                        },
                        []
                    )
                    .forEach(A => Widgets.AssociateFilter.append('<p data-lt-value="' + A.id + '">' + A.fullName + '</p>'));
            }
            Widgets.CustomerFirstName = $('input[name="search-first-name"]');
            Widgets.CustomerLastName = $('input[name="search-last-name"]');
            Widgets.CustomerEmail = $('input[name="search-email"]');
            Widgets.CustomerPhone = $('input[name="search-phone"]');
            Widgets.OrderInvoiceNumber = $('input[name="search-orderNum"]');
            Widgets.SearchBtn =
                $('.filterConditions-query-button').on('click', (function () {
                    function ClearOtherSide(Btn) {
                        if (Btn.hasClass('filter')) {
                            $('.advance-search-form').find('input').val('');
                        } else if (Btn.hasClass('search')) {
                            $('.inquiry-date-filter').find('input').val('');
                            $('.inquiry-date-filter .filter-box p:first-child').trigger('click');
                        } else {
                            throw new Error('Unrecognised button');
                        }
                    }
                    function GenerateURL(Btn) {
                        var URL = '/API/FieldService/GetProtectionPlans?retailerAffiliateId=' + RetailerData.retailerAffiliate.id;
                        if (Btn.hasClass('filter')) {
                            if (!Widgets.SubmitDateStartFilter.val() || !Widgets.SubmitDateEndFilter.val()) {
                                alert('Sale Date must be filled in');
                                return;
                            }
                            var Vals = {
                                SubmitDateStart: Widgets.SubmitDateStartFilter.val() || null,
                                SubmitDateEnd: Widgets.SubmitDateEndFilter.val() || null,
                                ProgressStatus: Widgets.ProgressStatusFilter.find('.selected').attr('data-lt-value') || null,
                                Store: Widgets.StoreFilter.find('.selected').attr('data-lt-value') || null,
                                Associate: Widgets.AssociateFilter.find('.selected').attr('data-lt-value') || null,
                            };
                            if (Vals.Associate) URL += '&associateAffiliateId=' + Vals.Associate;
                            if (Vals.SubmitDateStart) URL += `&startEffectiveTime=${Vals.SubmitDateStart}T00:00:00`;
                            if (Vals.SubmitDateEnd) {
                                let End = new Date(Vals.SubmitDateEnd + 'T00:00:00');
                                End.setDate(End.getDate() + 1);
                                URL += `&endEffectiveTime=${End.getFullYear()}-${('0' + (End.getMonth() + 1)).slice(-2)}-${('0' + End.getDate()).slice(-2)}T00:00:00`;
                            }
                            if (Vals.ProgressStatus) URL += '&progressStatus=' + Vals.ProgressStatus;
                            if (Vals.Store) URL += '&storeLocationId=' + Vals.Store;
                        } else if (Btn.hasClass('search')) {
                            var Vals = {
                                OrderInvoiceNumber: Widgets.OrderInvoiceNumber.val().trim() || null,
                                CustomerFirstName: Widgets.CustomerFirstName.val().trim() || null,
                                CustomerLastName: Widgets.CustomerLastName.val().trim() || null,
                                CustomerEmail: Widgets.CustomerEmail.val().trim() || null,
                                CustomerPhone: Widgets.CustomerPhone.val().replace(/[^0-9]/g, '') || null,
                            };
                            if (Vals.OrderInvoiceNumber) URL += '&orderInvoiceNumber=' + encodeURIComponent(Vals.OrderInvoiceNumber);
                            if (Vals.CustomerFirstName) URL += '&customerFirstName=' + encodeURIComponent(Vals.CustomerFirstName);
                            if (Vals.CustomerLastName) URL += '&customerLastName=' + encodeURIComponent(Vals.CustomerLastName);
                            if (Vals.CustomerEmail) URL += '&customerEmail=' + encodeURIComponent(Vals.CustomerEmail);
                            if (Vals.CustomerPhone) URL += '&customerPhoneNumber=' + encodeURIComponent(Vals.CustomerPhone);
                        } else {
                            throw new Error('Unrecognised button');
                        }
                        URL += '&$top=100&$skip=0';
                        return URL;
                    }
                    return function () {
                        var Btn = $(this);
                        Widgets.PlansElement.empty();
                        ClearOtherSide(Btn);
                        U.AJAX(GenerateURL(Btn)).then(R => {
                            var CanEdit = U.UserHasRole('C-Plan Inquiry-Modify Plan');
                            var CanCancel = U.UserHasRole('C-Plan Inquiry-Cancel Plan');
                            $(R.items.reduce(
                                (A, P) => {
                                    var ProgressStatus = P.progressStatus ? ProgressStatuses.find(S => S.id == P.progressStatus).code : '';
                                    return A +=
                                        `<tr data-lt-plan="${encodeURIComponent(JSON.stringify(P))}">
                                            <td data-label="Sale Date">${P.effectiveDate ? P.effectiveDate.substr(0, 10) : ''}</td>
                                            <td data-label="Customer">${P.customerFullName || ''}</td>
                                            <td data-label="Registration">${P.registrationId || ''}</td>
                                            <td data-label="Ord/Inv">${P.orderInvoiceNumber || ''}</td>
                                            <td data-label="Covered Item">${P.coveredItemAmount ? `$${P.coveredItemAmount.toFixed(2)}` : ''}</td>
                                            <td data-label="SKU">${P.skuCode || ''}</td>
                                            <td data-label="Plan Price">${P.listPrice ? `$${P.listPrice.toFixed(2)}` : ''}</td>
                                            <td data-label="Plan Cost">${P.planPrice ? `$${P.planPrice.toFixed(2)}` : ''}</td>
                                            <td data-label="Status">${ProgressStatus}</td>
                                            <td data-label="Edit Plan">${CanEdit && ProgressStatus == 'Submitted' ? '<i class="EditPlan fa fa-pencil-alt"></i>' : ''}</td>
                                            <td data-label="Cancel Plan">${CanCancel && ProgressStatus != 'Cancelled' ? '<i class="CancelPlan fa fa-trash-alt"></i>' : ''}</td>
                                        </tr>`;
                                },
                                ''
                            )).appendTo(Widgets.PlansElement);
                        });
                    };
                })());
            Widgets.PlanModificationWindow = $('.planRegistration-modal-container');
            Widgets.PlanModification = new LT.PlanManagement({
                SearchBtns: Widgets.SearchBtn,
                RetailerData: RetailerData
            });
            Widgets.PlanCancellationWindow = $('.cancelation-modal');
            Widgets.PlansElement = $('.allPlans-table table tbody');
            Widgets.PlansElement.on('click', '.EditPlan', function () {
                U.LoadingSplash.Show();
                var P = JSON.parse(decodeURIComponent($(this).closest('tr').attr('data-lt-plan')));
                Widgets.PlanModificationWindow.attr('data-lt-plan-id', P.id);
                Widgets.PlanModification.Associate.val('');
                Widgets.PlanModification.Associate.one('LTOptionsUpdated', function () {
                    Widgets.PlanModification.Associate.children().each(function () {
                        var Option = $(this);
                        if (Option.text() == P.associateFullNames) {
                            Widgets.PlanModification.Associate.val(Option.attr('value'));
                            return false;
                        }
                    });
                });
                Widgets.PlanModification.Store.val(P.storeLocationId || '').trigger('change');
                Widgets.PlanModification.OrderInvoiceRef.val(P.orderInvoiceNumber || '');
                Widgets.PlanModification.SaleDateField.val(P.effectiveDate ? P.effectiveDate.substr(0, 10) : '');
                Widgets.PlanModification.EstDeliveryField.val(P.estimatedDeliveryDate ? P.estimatedDeliveryDate.substr(0, 10) : '');
                Widgets.PlanModification.CustomerEmail.val(P.customerEmail || '');
                Widgets.PlanModification.CustomerFirstName.val(P.customerFirstName || '');
                Widgets.PlanModification.CustomerLastName.val(P.customerLastName || '');
                Widgets.PlanModification.CustomerPhone.val(P.customerPhone || '');
                Widgets.PlanModificationWindow.find('.new-planAdd').remove();
                $.when(
                    U.AJAX(`/API/Inventory/BillOfMaterials?$filter=(parentItemId eq ${RetailerData.rateCards.map(C => C.id).join(' or parentItemId eq ')}) and childItemId eq ${P.skuItemId}`, 'GET', false, false, 'silent')
                        .then(R => {
                            Widgets.PlanModification.SKU.one('LTOptionsUpdated', function () {
                                Widgets.PlanModification.SKU.val(P.skuItemId).attr('data-lt-previous-val', P.skuItemId);
                            });
                            Widgets.PlanModification.RateCard.val(R.items[0].parentItemId || '').trigger('change');
                            return R.items[0].parentItemId;
                        }),
                    U.AJAX('/API/fieldService/EventEquipment?$filter=eventId eq ' + P.id, 'GET', false, false, 'silent').then(R => R.items)
                ).then((RateCardId, Equipment) => {
                    var BasePrice =
                        U.PrepMathForView(
                            Equipment.reduce((A, Eq) => A + (U.PrepMoneyForMath(Eq.price) * U.PrepMoneyForMath(Eq.quantity || 1)), 0),
                            1
                        ).replace(/[^0-9.]/g, '');
                    U.AJAX(`/API/Core/GetRetailerMSRP/${P.storeLocationId}/${P.skuItemId}/${BasePrice}/`, 'GET', false, false, 'silent')
                        .then(R => {
                            $(`<div class="new-planAdd" data-lt-sku-id="${P.skuItemId}">
                                <div class="new-planAdd-title flex flex-row flex-vert-center flex-hor-between">
                                    <p>
                                        <span class="sku">${P.skuCode} (${P.skuDescription})</span>
                                        - Cost:
                                        $ <span class="sku-price" data-lt-is-variable="${R.price.isVariable ? 1 : 0}">${R.price.amount.toFixed(2)}</span>
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
                                        <tbody>
                                            ${Equipment.reduce((A, Eq) => { 
                                                var Data = {
                                                    equipmentTypeId: Eq.equipmentTypeId,
                                                    equipmentType: Eq.equipmentType,
                                                    productTypeId: Eq.alternateProductTypeId,
                                                    productType: Eq.alternateProductType,
                                                    description: Eq.equipmentDescription,
                                                    manufacturer: Eq.note,
                                                    model: Eq.model,
                                                    code: Eq.serialNumber,
                                                    quantity: Eq.quantity || 1,
                                                    price: Eq.price,
                                                };
                                                return A += `<tr data-lt-model="${encodeURIComponent(JSON.stringify(Data))}">
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
                                            }, '')}
                                        </tbody>
                                    </table>
                                </div>
                            </div>`)
                                .appendTo(Widgets.PlanModification.PlanRegistrationBox)
                                .find('.new-planAdd-detail').show();
                            Widgets.PlanModification.AddPlanBtn.css('background', '#d9d8d6').prop('disabled', true);
                            Widgets.PlanModification.SubmitBtn.css('background', '').prop('disabled', false);
                            Widgets.PlanModification.PlanRegistrationBox.show();
                            U.LoadingSplash.Hide();
                            Widgets.PlanModificationWindow.removeClass('non-visible');
                            Widgets.PlanModificationWindow.scrollTop(0);
                        });
                });
            });
            Widgets.PlanModificationWindow.on('click', '.close-modal', function () {
                Widgets.PlanModificationWindow.addClass('non-visible');
            });
            Widgets.PlansElement.on('click', '.CancelPlan', (function () {
                var PlanElem = Widgets.PlanCancellationWindow.find('.search-param-result .to-be-cancelled-plan-data');
                var EquipmentElem = Widgets.PlanCancellationWindow.find('.to-be-cancelled-plan-equipment tbody');
                var ReasonContainer = Widgets.PlanCancellationWindow.find('.reason-container');
                var ReasonElem = Widgets.PlanCancellationWindow.find('textarea[name="paragraph_text"]');
                var ConfirmationWindow = $('.remove-planModal-container.cancel-caution-container');
                var InProgressWarningElem = ConfirmationWindow.find('.InProgressClaimWarning').hide();
                var CancelledOrCompletedWarningElem = ConfirmationWindow.find('.AlreadyCancelledOrCompletedWarning').hide();
                Widgets.PlanCancellationWindow.on('click', '.close-modal', function () {
                    Widgets.PlanCancellationWindow.addClass('non-visible');
                    PlanElem.removeAttr('data-lt-plan-id').empty();
                    EquipmentElem.empty();
                });
                var CancelBtn = Widgets.PlanCancellationWindow.find('.cancelPlan-Button').on('click', function () {
                    var Reason = ReasonElem.val().trim();
                    if (!Reason.length) {
                        Widgets.PlanCancellationWindow.scrollTop(0);
                        ReasonElem.select();
                        return false;
                    }
                    ConfirmationWindow.removeClass('non-visible').one('click', '.Proceed, .close-modal', function () {
                        if ($(this).hasClass('Proceed')) {
                            U.AJAX(
                                '/API/FieldService/CancelProtectionPlan', 'POST',
                                {
                                    PlanEventId: PlanElem.attr('data-lt-plan-id'),
                                    CancellationReasonConversationText: Reason,
                                    ConversationTypeId: InternalConvType.id,
                                    EventTypeActivityId: null,
                                },
                                false, 'normal', true
                            ).then(R => {
                                if (['Default', 'Success'].indexOf(R) > -1) {
                                    ConfirmationWindow.addClass('non-visible');
                                    Widgets.PlanCancellationWindow.addClass('non-visible');
                                    Widgets.SearchBtn.first().trigger('click');
                                } else if (R == 'Failed_ApprovedTransactionsExist') {
                                    InProgressWarningElem.show();
                                    CancelledOrCompletedWarningElem.hide();
                                } else if (R == 'Failed_EventNotFoundOrAlreadyCancelledOrCompleted') {
                                    InProgressWarningElem.hide();
                                    CancelledOrCompletedWarningElem.show();
                                }
                            });
                        } else {
                            ConfirmationWindow.addClass('non-visible');
                            Widgets.PlanCancellationWindow.addClass('non-visible');
                        }
                    });
                });
                return function () {
                    var P = JSON.parse(decodeURIComponent($(this).closest('tr').attr('data-lt-plan')));
                    PlanElem.removeAttr('data-lt-plan-id').empty();
                    ReasonElem.val('');
                    EquipmentElem.empty();
                    InProgressWarningElem.hide();
                    CancelledOrCompletedWarningElem.hide();
                    U.AJAX('/API/fieldService/EventEquipment?$filter=eventId eq ' + P.id).then(EqR => {
                        PlanElem.attr('data-lt-plan-id', P.id);
                        PlanElem.html(
                            `<p><span class="u-bold" scope="col">Status: </span><span>${P.progressStatus ? ProgressStatuses.find(S => S.id == P.progressStatus).code : 'None'}</span></p>
                            <p><span class="u-bold" scope="col">Location: </span><span>${P.storeName || ''}</span></p>
                            <p><span class="u-bold" scope="col">Ord/Inv Ref: </span><span>${P.orderInvoiceNumber || ''}</span></p>
                            <p><span class="u-bold" scope="col">Sale Date: </span><span>${P.effectiveDate ? P.effectiveDate.substr(0, 10) : ''}</span></p>
                            <p><span class="u-bold" scope="col">Est. Delivery: </span><span>${P.estimatedDeliveryDate ? P.estimatedDeliveryDate.substr(0, 10) : ''}</span></p>
                            <p><span class="u-bold" scope="col">Advisor: </span><span>${P.associateFullNames || ''}</span></p>
                            <p><span class="u-bold" scope="col">Customer: </span><span>${P.customerFullName || ''}</span></p>
                            <p><span class="u-bold" scope="col">Phone: </span><span>${P.customerPhone || ''}</span></p>
                            <p><span class="u-bold" scope="col">Email: </span><span>${P.customerEmail || ''}</span></p>
                            <p><span class="u-bold" scope="col">Plan Type: </span><span>${P.skuDescription || ''}</span></p>
                            <p><span class="u-bold" scope="col">Plan Id: </span><span>${P.skuCode || ''}</span></p>
                            <p><span class="u-bold" scope="col">Plan Price: </span><span>${P.listPrice ? `$${P.listPrice.toFixed(2)}` : ''}</span></p>`
                        );
                        if (EqR.items.length) {
                            EqR.items.forEach(Eq => {
                                EquipmentElem.append(
                                    `<tr>
                                        <td data-label="Product">${Eq.alternateProductType || ''}</td>
                                        <td data-label="QTY">${Eq.quantity || 1}</td>
                                        <td data-label="Description">${Eq.equipmentDescription || ''}</td>
                                        <td data-label="SKU Number">${Eq.model || ''}</td>
                                        <td data-label="Manufacturer">${Eq.equipmentManufacturer || ''}</td>
                                        <td data-label="Serial NBR">${Eq.serialNumber}</td>
                                        <td data-label="Unit Price">${Eq.price ? `$${Eq.price.toFixed(2)}` : ''}</td>
                                        <td data-label="Total">$${U.PrepMathForView(U.PrepMoneyForMath(Eq.quantity || 1) * U.PrepMoneyForMath(Eq.price || 0), 1)}</td>
                                    </tr>`
                                );
                            });
                        }
                        Widgets.PlanCancellationWindow.removeClass('non-visible').scrollTop(0);
                        U.LoadingSplash.Hide();
                    });
                };
            })());


            U.ShowUI();

        });
    });

})();
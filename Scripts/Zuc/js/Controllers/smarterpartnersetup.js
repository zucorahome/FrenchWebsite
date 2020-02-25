/*

    smarterpartnersetup Controller for the View "smarterpartnersetup"
    Copyright 2020, LimeTAC Inc. All rights reserved.

*/

(function () {

    var U = new LTPublicUtils();
    var Token = U.GetURIParam('key');
    var CurrentYear = new Date().getFullYear();
    $.when(
        U.AJAX('/api/MarketPartner/GetMarketPartnerAssociationDefaults/' + Token, 'GET', false, false, 'silent').then(R => R),
        LT.LTCodes.Get('LocationCategories'),
        LT.LTCodes.Find('LocationAccuracyOptions', 'code', 'Default'),
        LT.LTCodes.Find('AffiliateLocationRelationTypeOptions', 'code', 'BillToAddress'),
        LT.LTCodes.Find('AffiliateLocationRelationTypeOptions', 'code', 'ShipToAddress'),
        LT.LTCodes.Get('AffiliateEventTypeCommissionEarningPaymentMethodOptions'),
        LT.LTCodes.Get('AffiliateEventTypePlanRegistrationPaymentMethodOptions'),
        LT.LTCodes.Get('AffiliateEventTypeProductPurchasePaymentMethodOptions'),
        LT.LTCodes.Get('Provinces'),
        LT.LTCodes.Get('BuyingGroups'),
        LT.LTCodes.Get('Languages')
    ).then((Partner, LocationCategories, AccuracyDefault, RelTypeBillTo, RelTypeShipTo, CommPayPrefs, PlanPayPrefs, ProdPayPrefs, Provinces, BuyingGroups, Languages) => {
        $(function () {

            var Widgets = {};

            // Step 1 fields
            Widgets.CompanyName = $('#su-company-name').val(Partner.fullName || '');
            Widgets.BusinessLegalName = $('#su-business-legal-name').val(Partner.businessLegalName || '');
            Widgets.BillToAddress1 = $('#su-address-1').val(Partner.billingAddress1 || '');
            Widgets.BillToAddress2 = $('#su-address-2').val(Partner.billingAddress2 || '');
            Widgets.BillToCity = $('#su-city').val(Partner.billingCity || '');
            Widgets.BillToProvinceId = $('#su-province');
            Provinces.forEach(P => Widgets.BillToProvinceId.append(`<option value="${P.id}" data-lt-country-id="${P.countryId}">${P.code}</option>`));
            Widgets.BillToProvinceId.val(Partner.billingProvinceId || '');
            Widgets.BillToPostal = $('#su-postal').val(Partner.billingPostalCode || '');
            Widgets.BillToPhone = $('#su-phone').val(Partner.billingPhone || '');
            Widgets.HstGstNumber = $('#su-tax-number').val(Partner.hstGstNumber || '');
            Widgets.BuyingGroupId = $('#su-buying-group');
            Widgets.BuyingGroupId
                .append(BuyingGroups.map(G => `<option value="${G.id}">${G.fullName}</option>`).join(''))
                .val(Partner.buyingGroup ? BuyingGroups.find(X => X.fullName == Partner.buyingGroup).id : '')
                .on('change', function () {
                    $(this).val()
                        ? Widgets.BuyingGroupMemberIdContainer.show()
                        : Widgets.BuyingGroupMemberIdContainer.hide();
                });
            Widgets.BuyingGroupMemberId = $('#su-member-id').val(Partner.buyingGroupMemberId || '');
            Widgets.BuyingGroupMemberIdContainer = Widgets.BuyingGroupMemberId.closest('.form-div');
            Widgets.BuyingGroupId.trigger('change');
            Widgets.LanguageId = $('#su-lang-pref');
            Widgets.LanguageId.append(Languages.map(L => `<option value="${L.id}">${L.description}</option>`));
            Widgets.LanguageId.val(Partner.preferredLanguageId || '');

            // Step 2 fields
            function RenderShipTos() {
                Widgets.ShipToList.empty();
                Partner.shipToAddresses.forEach(L => {
                    Widgets.ShipToList.append(
                        `<tr data-lt-id="${L.locationId}">
                            <td data-label="Code">${L.locationId}</td>
                            <td data-label="Location Name">${L.name}</td>
                            <td data-label="Address">${U.RenderAddress(L, Provinces, null, false, false, true)}</td>
                            <td data-label="Phone">${L.phone}</td>
                            <td data-label="Edit"><a class="su-locations-edit fas fa-pencil-alt"></a></td>
                        </tr>`
                    );
                });
            }
            Widgets.ShipToList = $('.su-locations tbody');
            RenderShipTos();
            Widgets.ShipToModal = $('.su-locations-add-modal-container').on('click', 'h2', () => { Widgets.ShipToModal.addClass('non-visible') });
            Widgets.ShipToName = $('#su-locations-add-name', Widgets.ShipToModal);
            Widgets.ShipToType = $('#su-locations-add-type', Widgets.ShipToModal);
            Widgets.ShipToAddress1 = $('#su-locations-add-address-1', Widgets.ShipToModal);
            Widgets.ShipToAddress2 = $('#su-locations-add-address-2', Widgets.ShipToModal);
            Widgets.ShipToCity = $('#su-locations-add-city', Widgets.ShipToModal);
            Widgets.ShipToProvinceId = $('#su-locations-add-province', Widgets.ShipToModal);
            Provinces.forEach(P => Widgets.ShipToProvinceId.append(`<option value="${P.id}" data-lt-country-id="${P.countryId}">${P.code}</option>`));
            Widgets.ShipToPostal = $('#su-locations-add-postal', Widgets.ShipToModal);
            Widgets.ShipToPhone = $('#su-locations-add-phone', Widgets.ShipToModal);
            Widgets.ShipToSave = $('.su-locations-add-save', Widgets.ShipToModal);
            Widgets.ShipToSaveAndAdd = $('.su-locations-add-save-and-add', Widgets.ShipToModal);
            function UpdateShipTo() {
                U.LoadingSplash.Show();
                var Data = GetShipToUserData();
                if (Data.every(D => D.OK)) {
                    Data = Data.reduce((A, D) => { A[D.Field] = D.Val; return A; }, {});
                    return U.AJAX('/api/FieldService/GetLocationNameSuggestions', 'GET', { name: Data.ShipToName, id: Data.ShipToId || -1 }, false, 'silent').then(R => {
                        Data.ShipToName = R[0];
                        if (!Data.ShipToId) {
                            // generate ShipTo
                            return U.AJAX(
                                '/api/FieldService/Locations', 'POST',
                                {
                                    accuracy: AccuracyDefault.id,
                                    address1: Data.ShipToAddress1,
                                    address2: Data.ShipToAddress2 || null,
                                    affiliateFullName: Partner.fullName,
                                    affiliateId: Partner.memberId,
                                    cityName: Data.ShipToCity,
                                    countryId: Data.ShipToCountryId,
                                    id: -1,
                                    isActive: true,
                                    latitude: Data.ShipToLatLng ? Data.ShipToLatLng[0] : null,
                                    longitude: Data.ShipToLatLng ? Data.ShipToLatLng[1] : null,
                                    name: Data.ShipToName,
                                    locationCategoryId: LocationCategories.find(C => C.code == Data.ShipToType).id,
                                    postalCode: Data.ShipToPostal,
                                    provinceId: Data.ShipToProvinceId,
                                    relationType: RelTypeShipTo.id, // presence of relationType and affiliateId cause an AffiliateLocation to be generated
                                    timeZone: Partner.homeTimeZone,
                                    phoneNumber: Data.ShipToPhone
                                },
                                false, 'silent', true
                            ).then(R => R.items[0]);
                        } else {
                            var Original = Partner.shipToAddresses.find(L => L.locationId == Data.ShipToId);
                            if (
                                Original.name != Data.ShipToName ||
                                Original.locationCategoryId != LocationCategories.find(C => C.code == Data.ShipToType).id ||
                                Original.address1 != Data.ShipToAddress1 ||
                                Original.address2 != Data.ShipToAddress2 ||
                                Original.cityName != Data.ShipToCity ||
                                Original.provinceId != Data.ShipToProvinceId ||
                                Original.postalCode != Data.ShipToPostal ||
                                Original.countryId != Data.ShipToCountryId ||
                                (Data.ShipToLatLng && (Original.latitude != Data.ShipToLatLng[0] || Original.longitude != Data.ShipToLatLng[1])) ||
                                Original.phone != Data.ShipToPhone
                            ) {
                                // update ShipTo
                                return U.AJAX('/api/FieldService/Locations?$filter=id eq ' + Data.ShipToId, 'GET', false, false, 'silent').then(R => {
                                    var L = R.items[0];
                                    L.name = Data.ShipToName;
                                    L.locationCategoryId = LocationCategories.find(C => C.code == Data.ShipToType).id;
                                    L.address1 = Data.ShipToAddress1;
                                    L.address2 = Data.ShipToAddress2;
                                    L.cityName = Data.ShipToCity;
                                    L.provinceId = Data.ShipToProvinceId;
                                    L.postalCode = Data.ShipToPostal;
                                    L.countryId = Data.ShipToCountryId;
                                    L.latitude = Data.ShipToLatLng ? Data.ShipToLatLng[0] : null;
                                    L.longitude = Data.ShipToLatLng ? Data.ShipToLatLng[1] : null;
                                    L.phoneNumber = Data.ShipToPhone;
                                    return U.AJAX('/api/FieldService/Locations(' + Data.ShipToId + ')', 'PUT', L, false, 'silent', true).then(R => R.items[0]);
                                });
                            } else {
                                return new $.Deferred().resolve(false);
                            }
                        }
                    });
                }
            }
            Widgets.ShipToSave.add(Widgets.ShipToSaveAndAdd).on('click', function () {
                var Btn = $(this);
                var Data = GetShipToUserData();
                if (Data.every(D => D.OK)) {
                    Data = Data.reduce((A, D) => { A[D.Field] = D.Val; return A; }, {});
                    UpdateShipTo(Data).then(R => {
                        if (typeof R == 'object') {
                            if (Data.ShipToId) {
                                var Original = Partner.shipToAddresses.find(L => L.locationId == R.id);
                                Original.locationId = R.id;
                                Original.name = R.name;
                                Original.locationCategoryId = LocationCategories.find(C => C.code == Data.ShipToType).id;
                                Original.address1 = R.address1;
                                Original.address2 = R.address2;
                                Original.cityName = R.cityName;
                                Original.provinceId = R.provinceId;
                                Original.postalCode = R.postalCode;
                                Original.countryId = R.countryId;
                                Original.latitude = R.latitude;
                                Original.longitude = R.longitude;
                                Original.phone = R.phoneNumber;
                            } else {
                                Partner.shipToAddresses.push({
                                    locationId: R.id,
                                    name: R.name,
                                    locationCategoryId: LocationCategories.find(C => C.code == Data.ShipToType).id,
                                    address1: R.address1,
                                    address2: R.address2,
                                    cityName: R.cityName,
                                    provinceId: R.provinceId,
                                    postalCode: R.postalCode,
                                    countryId: R.countryId,
                                    latitude: R.latitude,
                                    longitude: R.longitude,
                                    phone: R.phoneNumber
                                });
                            }
                        }
                        Widgets.ShipToModal.addClass('non-visible');
                        if (Btn.is('.su-locations-add-save-and-add')) {
                            setTimeout(() => { Widgets.AddShipTo.trigger('click') }, 650);
                        }
                        U.LoadingSplash.Hide();
                        RenderShipTos();
                    });
                } else {
                    var Widget = Widgets[Data.find(D => !D.OK).Field];
                    if (Widget) Widget.select()[0].scrollIntoView(false);
                }
            });
            function GetShipToUserData() {
                var Data = [];

                // Id
                Data.unshift({
                    Field: 'ShipToId',
                    Val: Widgets.ShipToModal.attr('data-lt-id') ? parseInt(Widgets.ShipToModal.attr('data-lt-id'), 10) : null,
                    OK: true // not required
                });
                // Name
                Data.unshift({
                    Field: 'ShipToName',
                    Val: Widgets.ShipToName.val().trim() || null
                });
                Data[0].OK = !!Data[0].Val;
                // Type
                Data.unshift({
                    Field: 'ShipToType',
                    Val: Widgets.ShipToType.val() || null
                });
                Data[0].OK = !!Data[0].Val;
                // Address1
                Data.unshift({
                    Field: 'ShipToAddress1',
                    Val: Widgets.ShipToAddress1.val().trim() || null
                });
                Data[0].OK = !!Data[0].Val;
                // Address2
                Data.unshift({
                    Field: 'ShipToAddress2',
                    Val: Widgets.ShipToAddress2.val().trim() || null,
                    OK: true // optional field
                });
                // City
                Data.unshift({
                    Field: 'ShipToCity',
                    Val: Widgets.ShipToCity.val().trim() || null
                });
                Data[0].OK = !!Data[0].Val;
                // ProvinceId
                Data.unshift({
                    Field: 'ShipToProvinceId',
                    Val: Widgets.ShipToProvinceId.val() || null
                });
                Data[0].OK = !!Data[0].Val;
                // CountryId
                Data.unshift({
                    Field: 'ShipToCountryId',
                    Val: Widgets.ShipToProvinceId.val() ? parseInt(Widgets.ShipToProvinceId.find(':selected').attr('data-lt-country-id'), 10) : null
                });
                Data[0].OK = !!Data[0].Val;
                // Postal
                Data.unshift({
                    Field: 'ShipToPostal',
                    Val: Widgets.ShipToPostal.val().trim() || null
                });
                Data[0].OK = !!Data[0].Val;
                // LatLng
                Data.unshift({
                    Field: 'ShipToLatLng',
                    Val: Widgets.ShipToAddress1.val().trim() && Widgets.ShipToAddress1.attr('data-lt-latlng') ? Widgets.ShipToAddress1.attr('data-lt-latlng').split(',').map(N => parseFloat(N)) : null,
                    OK: true // optional field
                });
                // Phone
                Data.unshift({
                    Field: 'ShipToPhone',
                    Val: Widgets.ShipToPhone.val().replace(/[^0-9]/g, '') || null
                });
                Data[0].OK = !!Data[0].Val;

                return Data.reverse();
            }
            Widgets.AddShipTo =
                $('.su-locations-add').on('click', function () {
                    Widgets.ShipToModal.find('input, select').val('');
                    Widgets.ShipToModal.removeClass('non-visible').removeAttr('data-lt-id');
                    Widgets.ShipToSaveAndAdd.show();
                    Widgets.ShipToName.select();
                });
            Widgets.ShipToList.on('click', '.su-locations-edit', function () {
                var Id = $(this).closest('tr').attr('data-lt-id');
                var L = Partner.shipToAddresses.find(L => L.locationId == Id);
                Widgets.AddShipTo.trigger('click');
                Widgets.ShipToName.val(L.name || '');
                Widgets.ShipToType.val(L.locationCategoryId ? LocationCategories.find(C => C.id == L.locationCategoryId).code : '');
                Widgets.ShipToAddress1.val(L.address1 || '');
                Widgets.ShipToAddress2.val(L.address2 || '');
                Widgets.ShipToCity.val(L.cityName || '');
                Widgets.ShipToProvinceId.val(L.provinceId || '');
                Widgets.ShipToPostal.val(L.postalCode || '');
                Widgets.ShipToPhone.val(L.phone || '');
                Widgets.ShipToModal.attr('data-lt-id', L.locationId);
                Widgets.ShipToSaveAndAdd.hide();
            });

            // Step 3 fields
            Widgets.PaymentPrefInfoIcon = $('.su-deposit-payment-pref-info-circle')
                .on('mouseover', () => { Widgets.PaymentPrefInfo.removeClass('non-visible') })
                .on('mouseout', () => { Widgets.PaymentPrefInfo.addClass('non-visible') })
                .on('click', () => { Widgets.PaymentPrefInfo.toggleClass('non-visible') });
            Widgets.PaymentPrefInfo = $('.su-deposit-payment-pref-info-text-container');
            Widgets.CommissionEarnings = $('[name="su-commission-payment-pref"]');
            Widgets.PlanRegistration = $('[name="su-plan-payment-pref"]');
            Widgets.ProductPurchases = $('[name="su-product-payment-pref"]');
            Widgets.BankingInfoIcon = $('.su-banking-details-info-circle').on('click', () => { Widgets.BankingInfoModal.removeClass('non-visible') });
            Widgets.BankingInfoModal = $('.su-banking-details-modal-container').on('click', '.close-modal', () => { Widgets.BankingInfoModal.addClass('non-visible') });
            Widgets.TransitNumber = $('#su-bank-transit-number');
            Widgets.InstitutionNumber = $('#su-bank-institution-number');
            Widgets.AccountNumber = $('#su-bank-account-number');
            Widgets.CreditCardInfoIcon = $('.su-credit-cards-info-circle')
                .on('mouseover', () => { Widgets.CreditCardInfo.removeClass('non-visible') })
                .on('mouseout', () => { Widgets.CreditCardInfo.addClass('non-visible') })
                .on('click', () => { Widgets.CreditCardInfo.toggleClass('non-visible') });
            Widgets.CreditCardInfo = $('.su-credit-cards-info-text-container');
            Widgets.CreditCardList =
                $('.su-credit-cards')
                    .on('click', '.su-credit-cards-expand', function () { $(this).toggleClass('fa-chevron-down fa-chevron-up').closest('li').find('.su-credit-cards-details').toggle() })
                    .on('click', '.su-credit-cards-remove', function () { $(this).closest('li').remove() })
                    .on('click', '.su-credit-cards-edit', function () {
                        var CC = JSON.parse(decodeURIComponent($(this).closest('li').attr('data-lt-model')));
                        Widgets.EditCreditCardDescription.html(
                            `<i class="su-credit-cards-type fab ${CC.Type ? `fa-cc-${CC.Type.toLowerCase()}` : 'fa-credit-card-alt'}"></i>
                            <p class="su-credit-cards-description">${CC.Type || 'Card'} ending in ${CC.Type == 'Amex' ? CC.Number.slice(-5) : CC.Number.slice(-4)}</p>`
                        );
                        Widgets.EditCreditCardMonth.val(CC.ExpiryMonth);
                        Widgets.EditCreditCardYear.val(CC.ExpiryYear);
                        Widgets.EditCreditCardIsDefault.prop('checked', CC.IsDefault);
                        Widgets.EditCreditCardName.val(CC.Name);
                        Widgets.EditCreditCardBillingName.text(CC.BillingAddress.name);
                        Widgets.EditCreditCardBillingAddress.html(U.RenderAddress(CC.BillingAddress, Provinces, null, false, false, true));
                        Widgets.EditCreditCardBillingPhone.text(CC.BillingAddress.phoneNumber);
                        Widgets.EditCreditCardModal.removeClass('non-visible');
                    });
            function RenderCCBillingAddresses() {
                var BillToData = Step.GetData(1);
                BillToData = $.extend({}, BillToData.find(D => D.Field == 'BillTo').Val, { Id: -1, Name: BillToData.find(D => D.Field == 'BusinessLegalName').Val });
                Widgets.AddCreditCardBillingAddresses.append(
                    `<div class="flex flex-vert-center">
                        <input id="su-credit-cards-add-billing-address-${BillToData.Id}" name="su-credit-cards-add-billing-address" type="radio" value="${BillToData.Id}" />
                        <label for="su-credit-cards-add-billing-address-${BillToData.Id}">
                            ${BillToData.Name},
                            ${BillToData.Address1}${BillToData.Address2 ? `, ${BillToData.Address2}` : ''},
                            ${BillToData.City},
                            ${Provinces.find(P => P.id == BillToData.ProvinceId).code},
                            ${BillToData.Postal}
                        </label>
                    </div>`
                );
                Partner.shipToAddresses.forEach(L => {
                    Widgets.AddCreditCardBillingAddresses.append(
                        `<div class="flex flex-vert-center">
                            <input id="su-credit-cards-add-billing-address-${L.locationId}" name="su-credit-cards-add-billing-address" type="radio" value="${L.locationId}" />
                            <label for="su-credit-cards-add-billing-address-${L.locationId}">
                                ${L.name},
                                ${L.address1}${L.address2 ? `, ${L.address2}` : ''},
                                ${L.cityName},
                                ${Provinces.find(P => P.id == L.provinceId).code},
                                ${L.postalCode}
                            </label>
                        </div>`
                    );
                });
            }
            Widgets.AddCreditCard = $('.su-credit-cards-add').on('click', function () {
                Widgets.AddCreditCardModal.find('input, select').val('');
                Widgets.AddCreditCardBillingAddresses.empty();
                RenderCCBillingAddresses();
                Widgets.AddCreditCardModal.removeClass('non-visible');
            });
            Widgets.AddCreditCardModal = $('.su-credit-cards-add-modal-container').on('click', 'h2', () => { Widgets.AddCreditCardModal.addClass('non-visible') });
            Widgets.AddCreditCardName = $('#su-credit-cards-add-name-on-card', Widgets.AddCreditCardModal);
            Widgets.AddCreditCardNumber = $('#su-credit-cards-add-card-number', Widgets.AddCreditCardModal);
            Widgets.AddCreditCardMonth = $('#su-credit-cards-add-expiry-month', Widgets.AddCreditCardModal);
            Widgets.AddCreditCardYear = $('#su-credit-cards-add-expiry-year', Widgets.AddCreditCardModal);
            Widgets.AddCreditCardCVV = $('#su-credit-cards-add-cvv', Widgets.AddCreditCardModal);
            Widgets.AddCreditCardBillingAddresses = $('.su-credit-cards-add-billing-addresses', Widgets.AddCreditCardModal);
            Widgets.AddCreditCardBillingAddressAdd = $('.su-credit-cards-add-billing-address-add', Widgets.AddCreditCardModal).hide();
            Widgets.AddCreditCardSave = $('.su-credit-cards-add-done', Widgets.AddCreditCardModal).on('click', function () {
                var BillingAddressId = Widgets.AddCreditCardBillingAddresses.find('[name="su-credit-cards-add-billing-address"]:checked').val() || null;
                var CC = {
                    Name: Widgets.AddCreditCardName.val().trim() || null,
                    Number: Widgets.AddCreditCardNumber.val().replace(/[^0-9]/g, '') || null,
                    Type: null,
                    ExpiryMonth: Widgets.AddCreditCardMonth.val() || null,
                    ExpiryYear: Widgets.AddCreditCardYear.val() || null,
                    CVV: Widgets.AddCreditCardCVV.val() || null,
                    BillingAddress: null,
                    IsDefault: Widgets.CreditCardList.children().length < 1,
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
                } else {
                    if (BillingAddressId > -1) {
                        CC.BillingAddress = Partner.shipToAddresses.find(L => L.locationId == BillingAddressId);
                    } else {
                        let BillTo = Step.GetData(1).find(D => D.Field == 'BillTo').Val;
                        CC.BillingAddress =
                            {
                                locationId: BillingAddressId,
                                name: BillTo.Name,
                                address1: BillTo.Address1,
                                address2: BillTo.Address2,
                                cityName: BillTo.City,
                                provinceId: BillTo.ProvinceId,
                                countryId: BillTo.CountryId,
                                postalCode: BillTo.Postal,
                                phoneNumber: BillTo.Phone
                            };
                    }
                }
                Widgets.CreditCardList.append(
                    `<li data-lt-model="${encodeURIComponent(JSON.stringify(CC))}">
                        <div class="credit-card-heading">
                            <div class="flex flex-vert-center flex-hor-start">
                                <i class="su-credit-cards-type fab ${CC.Type ? `fa-cc-${CC.Type.toLowerCase()}` : 'fa-credit-card-alt'}"></i>
                                <p class="su-credit-cards-description">
                                    ${CC.Type || 'Card'} ending in ${CC.Type == 'Amex' ? CC.Number.slice(-5) : CC.Number.slice(-4)}
                                    ${CC.IsDefault ? '<span>(Default)</span>' : ''}
                                </p>
                            </div>
                            <div class="flex-hor-end flex flex-vert-center">
                                <span class="su-credit-cards-expiry">Expires ${CC.ExpiryMonth}/${CC.ExpiryYear}</span>
                                <i class="su-credit-cards-expand fa fa-chevron-down"></i>
                            </div>
                        </div>
                        <div class="su-credit-cards-details" style="display: none;">
                            <div class="su-credit-cards-name">
                                <h5>Name on card</h5>
                                <span class="su-credit-cards-name-on-card">${CC.Name}</span>
                            </div>
                            <div class="su-credit-cards-billing">
                                <h5>Billing address</h5>
                                <div class="su-credit-cards-billing-name">${CC.BillingAddress.name}</div>
                                <div class="su-credit-cards-billing-address">${U.RenderAddress(CC.BillingAddress, Provinces, null, false, false, true)}</div>
                                <div class="su-credit-cards-billing-phone">${CC.BillingAddress.phoneNumber}</div>
                            </div>
                            <div class="flex flex-vert-center mobile-column">
                                <button class="su-credit-cards-remove zuc-btn zuc-btn-secondary">Remove</button>
                                <!--<button class="su-credit-cards-edit zuc-btn zuc-btn-secondary">Edit</button>-->
                            </div>
                        </div>
                    </li>`
                );
                Widgets.AddCreditCardModal.addClass('non-visible');
            });
            Widgets.EditCreditCardModal = $('.su-credit-cards-edit-modal-container').on('click', 'h2', () => { Widgets.EditCreditCardModal.addClass('non-visible') });
            Widgets.EditCreditCardDescription = $('.su-credit-cards-edit-description', Widgets.EditCreditCardModal);
            Widgets.EditCreditCardMonth = $('#su-credit-cards-edit-expiry-month', Widgets.EditCreditCardModal);
            Widgets.EditCreditCardYear = $('#su-credit-cards-edit-expiry-year', Widgets.EditCreditCardModal);
            Widgets.EditCreditCardIsDefault = $('#su-credit-cards-edit-is-default', Widgets.EditCreditCardModal);
            Widgets.EditCreditCardName = $('#su-credit-cards-edit-name-on-card', Widgets.EditCreditCardModal);
            Widgets.EditCreditCardBillingAddressEdit = $('.su-credit-cards-edit-billing-address-edit', Widgets.EditCreditCardModal);
            Widgets.EditCreditCardBillingName = $('.su-credit-cards-edit-billing-name', Widgets.EditCreditCardModal);
            Widgets.EditCreditCardBillingAddress = $('.su-credit-cards-edit-billing-address', Widgets.EditCreditCardModal);
            Widgets.EditCreditCardBillingPhone = $('.su-credit-cards-edit-billing-phone', Widgets.EditCreditCardModal);
            Widgets.EditCreditCardBillingCancel = $('.su-credit-cards-edit-cancel', Widgets.EditCreditCardModal).on('click', () => { Widgets.EditCreditCardModal.addClass('non-visible') });
            Widgets.EditCreditCardBillingSave = $('.su-credit-cards-edit-save', Widgets.EditCreditCardModal).on('click', function () {
                // TODO
                Widgets.EditCreditCardModal.addClass('non-visible');
            });
            [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].forEach(Addend => {
                var YYYY = CurrentYear + Addend;
                var HTML = `<option value="${YYYY}">${YYYY}</option>`;
                Widgets.AddCreditCardYear.append(HTML);
                Widgets.EditCreditCardYear.append(HTML);
            });
            Widgets.ReadAndAgree = $('#su-read-agree-to-terms');

            // navigation
            Widgets.Prev = $('.su-prev').on('click', () => Step.Prev());
            Widgets.Next = $('.su-next').on('click', () => Step.Next());
            Widgets.Submit = $('.su-submit').on('click', (function () {
                function UpdateBillTo(BillTo, CompanyName) {
                    U.LoadingSplash.Show();
                    if (!Partner.billingAddressLocationId) {
                        // generate BillTo
                        return U.AJAX(
                            '/api/FieldService/GetLocationNameSuggestions', 'GET',
                            { name: CompanyName, id: -1 }, false, 'silent'
                        ).then(R => U.AJAX(
                            '/api/FieldService/Locations', 'POST',
                            {
                                accuracy: AccuracyDefault.id,
                                address1: BillTo.Address1,
                                address2: BillTo.Address2 || null,
                                affiliateFullName: Partner.fullName,
                                affiliateId: Partner.memberId,
                                cityName: BillTo.City,
                                countryId: BillTo.CountryId,
                                id: -1,
                                isActive: true,
                                latitude: BillTo.LatLng ? BillTo.LatLng[0] : null,
                                longitude: BillTo.LatLng ? BillTo.LatLng[1] : null,
                                name: R[0],
                                postalCode: BillTo.Postal,
                                provinceId: BillTo.ProvinceId,
                                relationType: RelTypeBillTo.id, // presence of relationType and affiliateId cause an AffiliateLocation to be generated
                                timeZone: Partner.homeTimeZone,
                            },
                            false, 'silent', true
                        )).then(R => R.items[0].id);
                    } else if (
                        Partner.billingAddress1 != BillTo.Address1 ||
                        Partner.billingAddress2 != BillTo.Address2 ||
                        Partner.billingCity != BillTo.City ||
                        Partner.billingProvinceId != BillTo.ProvinceId ||
                        Partner.billingPostalCode != BillTo.Postal ||
                        Partner.billingCountryId != BillTo.CountryId
                    ) {
                        // update BillTo
                        return U.AJAX('/api/FieldService/Locations?$filter=id eq ' + Partner.billingAddressLocationId, 'GET', false, false, 'silent').then(R => {
                            var L = R.items[0];
                            L.address1 = BillTo.Address1;
                            L.address2 = BillTo.Address2;
                            L.cityName = BillTo.City;
                            L.provinceId = BillTo.ProvinceId;
                            L.postalCode = BillTo.Postal;
                            L.countryId = BillTo.CountryId;
                            L.latitude = BillTo.LatLng ? BillTo.LatLng[0] : null;
                            L.longitude = BillTo.LatLng ? BillTo.LatLng[1] : null;
                            return U.AJAX('/api/FieldService/Locations(' + Partner.billingAddressLocationId + ')', 'PUT', L, false, 'silent', true);
                        }).then(R => Partner.billingAddressLocationId);
                    } else {
                        return new $.Deferred().resolve(Partner.billingAddressLocationId);
                    }
                }
                function GenerateCreditCards() {
                    return $.when.apply(
                        null,
                        $.map(Widgets.CreditCardList.children(), X => {
                            var $X = $(X);
                            if (!$X.is('[data-lt-id]')) {
                                var Data = JSON.parse(decodeURIComponent($X.attr('data-lt-model')));
                                return U.AJAX(
                                    '/api/PaymentService/v2/CreateBillingAddress', 'POST',
                                    {
                                        affiliateId: Partner.memberId,
                                        address: {
                                            address1: Data.BillingAddress.address1,
                                            address2: Data.BillingAddress.address2,
                                            city: Data.BillingAddress.cityName,
                                            provinceId: Data.BillingAddress.provinceId,
                                            countryId: Data.BillingAddress.countryId,
                                            postalCode: Data.BillingAddress.postalCode,
                                            phone: Data.BillingAddress.phoneNumber,
                                            email: null,
                                        },
                                        cardholderName: Data.Name,
                                        cardNumber: Data.Number,
                                        cardVerificationValue: Data.CVV,
                                        expiry: Data.ExpiryYear + '-' + Data.ExpiryMonth,
                                    },
                                    false, 'normal', true
                                ).then(R => { $X.attr('data-lt-id', R.affiliateLocationId) });
                            } else {
                                return {};
                            }
                        })
                    );
                }
                return function () {
                    var Data = Step.GetData();
                    if (Data.every(D => D.OK)) {
                        Data = Data.reduce((A, D) => { A[D.Field] = D.Val; return A; }, {});
                        Data.Token = Token;
                        $.when(
                            GenerateCreditCards(),
                            UpdateBillTo(Data.BillTo, Data.CompanyName).then(BillToLocId => { Data.BillToLocationId = BillToLocId })
                        ).then(() => {
                            delete Data.BillTo;
                            delete Data.CreditCardList;
                            return U.AJAX('/api/MarketPartner/SaveMarketPartnerAssociationDetail', 'POST', Data).then(() => {
                                var SubmittedModal = $('.su-submitted-modal-container')
                                    .removeClass('non-visible')
                                    .on('click', '.close-modal', () => {
                                        window.location.href = '/zuc/aboutsps';
                                        SubmittedModal.addClass('non-visible');
                                });
                            });
                        });
                    } else {
                        var Widget = Widgets[Data.find(D => !D.OK).Field];
                        if (Widget) Widget.select()[0].scrollIntoView(false);
                    }
                };
            })());

            var Step = function () {
                var Current = 1;
                var Views = $('.su-step-1, .su-step-2, .su-step-3');
                function IsValidStep(Num) {
                    return typeof Num == 'number' && Num == parseInt(Num) && Num >= 1 && Num <= Views.length;
                }
                return {
                    Get: () => Current,
                    DataEntryDone: Num => IsValidStep(Num) ? Step.GetData(Num).every(D => D.OK) : null,
                    GetData: function (Num) {
                        if (typeof Num == 'undefined' || IsValidStep(Num)) {
                            var Data = [];
                            if (Num === 1 || !Num) {
                                // CompanyName
                                Data.unshift({
                                    Field: 'CompanyName',
                                    Val: Widgets.CompanyName.val().trim() || null
                                });
                                Data[0].OK = !!Data[0].Val;
                                // BusinessLegalName
                                Data.unshift({
                                    Field: 'BusinessLegalName',
                                    Val: Widgets.BusinessLegalName.val().trim() || null
                                });
                                Data[0].OK = !!Data[0].Val;
                                // BillTo
                                Data.unshift({
                                    Field: 'BillTo',
                                    Val: {
                                        Address1: Widgets.BillToAddress1.val().trim() || null,
                                        Address2: Widgets.BillToAddress2.val().trim() || null,
                                        City: Widgets.BillToCity.val().trim() || null,
                                        ProvinceId: Widgets.BillToProvinceId.val() || null,
                                        Postal: Widgets.BillToPostal.val().trim() || null,
                                        CountryId: Widgets.BillToProvinceId.val() ? parseInt(Widgets.BillToProvinceId.find(':selected').attr('data-lt-country-id'), 10) : null,
                                        LatLng: Widgets.BillToAddress1.val().trim() && Widgets.BillToAddress1.attr('data-lt-latlng') ? Widgets.BillToAddress1.attr('data-lt-latlng').split(',').map(N => parseFloat(N)) : null,
                                        Phone: Widgets.BillToPhone.val().replace(/[^0-9]/g, '') || null
                                    }
                                });
                                Data[0].OK = !!Data[0].Val.Address1 && !!Data[0].Val.City && !!Data[0].Val.ProvinceId && !!Data[0].Val.Postal && !!Data[0].Val.CountryId && !!Data[0].Val.Phone;
                                // HstGstNumber
                                Data.unshift({
                                    Field: 'HstGstNumber',
                                    Val: Widgets.HstGstNumber.val().trim() || null
                                });
                                Data[0].OK = !!Data[0].Val;
                                // BuyingGroupId
                                Data.unshift({
                                    Field: 'BuyingGroupId',
                                    Val: Widgets.BuyingGroupId.val() || null,
                                    OK: true // optional field
                                });
                                // MemberId
                                Data.unshift({
                                    Field: 'MemberId',
                                    Val: Partner.memberId,
                                    OK: !!Partner.memberId
                                });
                                // BuyingGroupMemberId
                                Data.unshift({
                                    Field: 'BuyingGroupMemberId',
                                    Val: Widgets.BuyingGroupId.val() ? (Widgets.BuyingGroupMemberId.val().trim() || null) : null,
                                });
                                Data[0].OK = !Widgets.BuyingGroupId.val() || !!Data[0].Val;
                                // LanguageId
                                Data.unshift({
                                    Field: 'LanguageId',
                                    Val: Widgets.LanguageId.val() || null
                                });
                                Data[0].OK = !!Data[0].Val;
                            }
                            if (Num === 2 || !Num) {
                                Data.unshift({
                                    Field: 'ShipToAddressIdList',
                                    Val: $.map(Widgets.ShipToList.children(), ST => parseInt($(ST).attr('data-lt-id'), 10))
                                });
                                Data[0].OK = !!Data[0].Val.length;
                            }
                            if (Num === 3 || !Num) {
                                // CommissionEarnings
                                Data.unshift({
                                    Field: 'CommissionEarnings',
                                    Val:
                                        Widgets.CommissionEarnings.filter(':checked').length
                                            ? CommPayPrefs.find(P => P.code == Widgets.CommissionEarnings.filter(':checked').val().replace(/\s/g, '')).id
                                            : null
                                });
                                Data[0].OK = U.IsNumber(Data[0].Val);
                                // PlanRegistration
                                Data.unshift({
                                    Field: 'PlanRegistration',
                                    Val:
                                        Widgets.PlanRegistration.filter(':checked').length
                                            ? PlanPayPrefs.find(P => P.code == Widgets.PlanRegistration.filter(':checked').val().replace(/\s/g, '')).id
                                            : null
                                });
                                Data[0].OK = U.IsNumber(Data[0].Val);
                                // ProductPurchases
                                Data.unshift({
                                    Field: 'ProductPurchases',
                                    Val:
                                        Widgets.ProductPurchases.filter(':checked').length
                                            ? ProdPayPrefs.find(P => P.code == Widgets.ProductPurchases.filter(':checked').val().replace(/\s/g, '')).id
                                            : null
                                });
                                Data[0].OK = U.IsNumber(Data[0].Val);
                                // TransitNumber
                                Data.unshift({
                                    Field: 'TransitNumber',
                                    Val: Widgets.TransitNumber.val().trim() || null
                                });
                                Data[0].OK = !!Data[0].Val;
                                // InstitutionNumber
                                Data.unshift({
                                    Field: 'InstitutionNumber',
                                    Val: Widgets.InstitutionNumber.val().trim() || null
                                });
                                Data[0].OK = !!Data[0].Val;
                                // AccountNumber
                                Data.unshift({
                                    Field: 'AccountNumber',
                                    Val: Widgets.AccountNumber.val().trim() || null
                                });
                                Data[0].OK = !!Data[0].Val;
                                // CreditCardList
                                Data.unshift({
                                    Field: 'CreditCardList',
                                    Val: Widgets.CreditCardList.children().length
                                });
                                Data[0].OK = Data[0].Val > 0;
                                // ReadAndAgree
                                Data.unshift({
                                    Field: 'ReadAndAgree',
                                    Val: Widgets.ReadAndAgree.is(':checked')
                                });
                                Data[0].OK = Data[0].Val;
                            }
                            return Data.reverse();
                        }
                    },
                    Next: function () {
                        if (Step.DataEntryDone(Current)) {
                            Step.Set(Math.min(Current + 1, Views.length));
                        } else {
                            var Widget = Widgets[Step.GetData(Current).find(D => !D.OK).Field];
                            if (Widget) Widget.select()[0].scrollIntoView(false);
                        }
                    },
                    Prev: () => Step.Set(Math.max(Current - 1, 1)),
                    Set: function (Num) {
                        if (IsValidStep(Num)) {
                            Views.hide();
                            Widgets.Prev.hide();
                            Widgets.Next.hide();
                            Widgets.Submit.hide();
                            Views.eq(Num - 1).show();
                            if (Num > 1) Widgets.Prev.show();
                            if (Num < Views.length) Widgets.Next.show();
                            if (Num === Views.length) Widgets.Submit.show();
                            Current = Num;
                            $('html').scrollTop(0);
                        }
                    }
                };
            }();

            Step.Set(1);
            U.ShowUI();

        });
    });

})();
/*

    retailerprofile Controller for the View "retailerprofile"
    Copyright 2019, LimeTAC Inc. All rights reserved.

*/

(function () {

    var U = new LTPublicUtils();

    $.when(
        LT.LTCodes.Get('CanadianProvinceList')
            .then(R => R.sort((A, B) => A.code.toUpperCase() > B.code.toUpperCase() ? 1 : A.code.toUpperCase() < B.code.toUpperCase() ? -1 : 0)),
        LT.LTCodes.Get('Countries')
            .then(R => R.sort((A, B) => A.code.toUpperCase() > B.code.toUpperCase() ? 1 : A.code.toUpperCase() < B.code.toUpperCase() ? -1 : 0)),
        LT.LTCodes.Get('Languages'),
        LT.LTCodes.Get('LocationAccuracyOptions'),
        LT.LTCodes.Find('AffiliateLocationRelationTypeOptions', 'code', 'ShipToAddress'),
        LT.LTCodes.Find('AffiliateLocationRelationTypeOptions', 'code', 'AccountManager'),
        LT.LTCodes.Find('PreferredCommunicationOptions', 'code', 'None'),
        $.when(
            LT.LTCodes.Find('AffiliateLocationRelationTypeOptions', 'code', 'BillToAddress'),
            U.AJAX('/API/Core/GetRetailerDatas', 'GET', false, false, 'silent').then(R => R)
        ).then((BillToRelType, RetailerInfo) => {
            return $.when(
                U.AJAX(`/API/Core/AffiliateLocations/-1/null/null/${BillToRelType.id}?geofenceIdListString=&$filter=affiliateId eq ${RetailerInfo.retailerAffiliate.id}`, 'GET', false, false, 'silent')
                    .then(R => R.items[0] ? U.AJAX('/API/FieldService/Locations?$filter=id eq ' + R.items[0].locationId, 'GET', false, false, 'silent') : new $.Deferred().resolve({ items: [{}] }))
                    .then(R => { RetailerInfo.retailerBillToLocation = R.items[0] }),
                (RetailerInfo.locations != null
                    ? U.AJAX('/API/FieldService/Locations?$filter=id eq ' + RetailerInfo.locations.map(L => L.id).join(' or id eq '), 'GET', false, false, 'silent')
                        .then(R => {
                            RetailerInfo.locations.forEach((L, I, A) => {
                                A[I] = R.items.find(RX => RX.id == L.id);
                            });
                            RetailerInfo.locations.sort((A, B) => A.name.toUpperCase() > B.name.toUpperCase() ? 1 : A.name.toUpperCase() < B.name.toUpperCase() ? -1 : 0);
                        })
                    : {})
            ).then(() => RetailerInfo);
        })
    ).then((CanadianProvinceList, Countries, Languages, LocationAccuracyOptions, ShipToRelType, AccountManagerRelType, PrefCommNone, ExtendedRetailerInfo) => {
        $(function () {

            var Widgets = {};

            Widgets.RetailerName = $('input[name="retailer-store-name"]').val(ExtendedRetailerInfo.retailerAffiliate.fullName);
            Widgets.RetailerLegalName = $('input[name="retailer-business-name"]').val(ExtendedRetailerInfo.retailerAffiliate.lastName);
            Widgets.RetailerLangPref = $('select[name="lang-pref"]');
            Languages.forEach(L => { Widgets.RetailerLangPref.append(`<option value="${L.id}">${L.description}</option>`) });
            Widgets.RetailerLangPref.val(ExtendedRetailerInfo.retailerAffiliate.preferredLanguageId);
            Widgets.RetailerTaxNumber = $('input[name="hst-gst"]').val(ExtendedRetailerInfo.retailerAffiliate.externalCode || '');
            Widgets.RetailerName.add(Widgets.RetailerLegalName).add(Widgets.RetailerLangPref).add(Widgets.RetailerTaxNumber).on('change', function () {
                var FN = Widgets.RetailerName.val().trim() || null;
                var LN = Widgets.RetailerLegalName.val().trim() || null;
                var PL = parseInt(Widgets.RetailerLangPref.val(), 10) || null;
                var TN = Widgets.RetailerTaxNumber.val() || null;
                if (FN) {
                    $.when(
                        typeof ExtendedRetailerInfo.retailerAffiliate.qualityIndex == 'undefined' // a field we don't have unless we have the full record
                            ? U.AJAX('/API/Core/Affiliates?$filter=id eq ' + ExtendedRetailerInfo.retailerAffiliate.id, 'GET', false, false, 'silent')
                                .then(R => R.items[0])
                            : new $.Deferred().resolve(ExtendedRetailerInfo.retailerAffiliate)
                    ).then(A => U.AJAX(
                        `/API/Core/Affiliates(${A.id})`, 'PUT',
                        $.extend(A, { fullName: FN, lastName: LN, preferredLanguageId: PL, externalCode: TN }),
                        false, 'silent', true
                    )).then(R => {
                        ExtendedRetailerInfo.retailerAffiliate = R.items[0];
                    });
                }
            });
            Widgets.RetailerBuyingGroup = $('.buying-group').text(ExtendedRetailerInfo.buyingGroup ? ExtendedRetailerInfo.buyingGroup.fullName : '');

            Widgets.BillToAddress1 = $('input[name="profile-address-1"]').val(ExtendedRetailerInfo.retailerBillToLocation.address1);
            Widgets.BillToAddress2 = $('input[name="profile-address-2"]').val(ExtendedRetailerInfo.retailerBillToLocation.address2 || '');
            Widgets.BillToCity = $('input[name="profile-city"]').val(ExtendedRetailerInfo.retailerBillToLocation.cityName || '');
            Widgets.BillToProvince = $('select[name="profile-province"]');
            CanadianProvinceList.forEach(P => { Widgets.BillToProvince.append(`<option value="${P.id}">${P.code}</option>`) });
            Widgets.BillToProvince.val(ExtendedRetailerInfo.retailerBillToLocation.provinceId);
            Widgets.BillToPostal = $('input[name="profile-postalCode"]').val(ExtendedRetailerInfo.retailerBillToLocation.postalCode);
            Widgets.BillToAddress1.add(Widgets.BillToAddress2).add(Widgets.BillToCity).add(Widgets.BillToProvince).add(Widgets.BillToPostal).on('change', function () {
                var Vals = {
                    address1: Widgets.BillToAddress1.val(),
                    address2: Widgets.BillToAddress2.val() || null,
                    cityName: Widgets.BillToCity.val(),
                    provinceId: Widgets.BillToProvince.val(),
                    postalCode: Widgets.BillToPostal.val(),
                };
                if (Vals.address1 && Vals.cityName && Vals.provinceId && Vals.postalCode) {
                    ExtendedRetailerInfo.retailerBillToLocation.address1 = Vals.address1;
                    ExtendedRetailerInfo.retailerBillToLocation.address2 = Vals.address2;
                    ExtendedRetailerInfo.retailerBillToLocation.cityName = Vals.cityName;
                    ExtendedRetailerInfo.retailerBillToLocation.provinceId = Vals.provinceId;
                    ExtendedRetailerInfo.retailerBillToLocation.postalCode = Vals.postalCode;
                    U.AJAX(
                        `/API/FieldService/Locations(${ExtendedRetailerInfo.retailerBillToLocation.id})`, 'PUT',
                        ExtendedRetailerInfo.retailerBillToLocation,
                        false, 'silent', true
                    );
                }
            });

            function RenderLocation(L) {
                return `<tr data-lt-location-id="${L.id}" data-lt-location="${encodeURIComponent(JSON.stringify(L))}">
                    <td data-label="Code">${L.id}</td>
                    <td data-label="Location Name">
                        ${L.name}
                        <a class="shipping-location-edit fa fa-pencil-alt purple-text" title="Edit" style="cursor: pointer;"></a>
                    </td>
                    <td data-label="Address">${U.RenderAddress(L, CanadianProvinceList, Countries, false, false, true)}</td>
                    <td data-label="Phone">${L.phoneNumber}</td>
                </tr>`;
            }
            Widgets.RetailerLocations =
                $('.retailer-locations tbody').append(
                    ExtendedRetailerInfo.locations.reduce((A, L) => A += RenderLocation(L), '')
                );
            function OpenLocationBox() {
                Widgets.LocationBox.removeAttr('data-lt-location-id');
                Widgets.LocationBox.removeClass('non-visible');
                Widgets.LocationBox.find('input, select').val('');
            }
            Widgets.RetailerLocations.on('click', '.shipping-location-edit', function () {
                OpenLocationBox();
                // set data
                var Data = JSON.parse(decodeURIComponent($(this).closest('tr').attr('data-lt-location')));
                Widgets.LocationBox.attr('data-lt-location-id', Data.id);
                Widgets.LocationBoxName.val(Data.name);
                Widgets.LocationBoxPhone.val(Data.phoneNumber);
                Widgets.LocationBoxAddress1.val(Data.address1);
                Widgets.LocationBoxAddress2.val(Data.address2 || '');
                Widgets.LocationBoxCity.val(Data.cityName);
                Widgets.LocationBoxProvince.val(Data.provinceId);
                Widgets.LocationBoxPostal.val(Data.postalCode);
            });
            Widgets.AddLocationBtn =
                $('.location-form-button').on('click', function () {
                    OpenLocationBox();
                });
            Widgets.LocationBox = $('.shipping-locations-modal');
            Widgets.LocationBoxName =
                $('input[name="location-name"]').on('change', function () {
                    U.AJAX(`/API/FieldService/GetLocationNameSuggestions?name=${encodeURIComponent(Widgets.LocationBoxName.val().trim())}&id=-1`, 'GET', false, false, 'silent')
                        .then(R => { Widgets.LocationBoxName.val(R[0]) });
                });
            Widgets.LocationBoxType = $('select[name="location-type"]');
            Widgets.LocationBoxPhone = $('input[name="location-phone"]');
            Widgets.LocationBoxAddress1 = $('input[name="location-address-one"]');
            Widgets.LocationBoxAddress2 = $('input[name="location-address-two"]');
            Widgets.LocationBoxCity = $('input[name="location-city"]');
            Widgets.LocationBoxProvince = $('select[name="location-province"]');
            CanadianProvinceList.forEach(P => Widgets.LocationBoxProvince.append(`<option value="${P.id}">${P.code}</option>`));
            Widgets.LocationBoxPostal = $('input[name="location-postal-code"]');
            Widgets.LocationBoxSave =
                $('.location-save').on('click', function () {
                    var LocationId = parseInt(Widgets.LocationBox.attr('data-lt-location-id'), 10) || -1;
                    var SavePromise = null;
                    if (LocationId > -1) {
                        var ExistingRow = Widgets.RetailerLocations.find(`[data-lt-location-id="${LocationId}"]`);
                        var Data = JSON.parse(decodeURIComponent(ExistingRow.attr('data-lt-location')));
                        Data.name = Widgets.LocationBoxName.val().trim();
                        Data.phoneNumber = Widgets.LocationBoxPhone.val().trim();
                        Data.address1 = Widgets.LocationBoxAddress1.val().trim();
                        Data.address2 = Widgets.LocationBoxAddress2.val().trim() || null;
                        Data.cityName = Widgets.LocationBoxCity.val().trim();
                        Data.provinceId = Widgets.LocationBoxProvince.val();
                        Data.postalCode = Widgets.LocationBoxPostal.val().trim();
                        SavePromise =
                            U.AJAX(`/API/FieldService/Locations(${LocationId})`, 'PUT', Data, false, 'normal', true);
                    } else {
                        SavePromise =
                            U.AJAX(
                                '/API/FieldService/Locations', 'POST',
                                {
                                    id: LocationId,
                                    name: Widgets.LocationBoxName.val(),
                                    phoneNumber: Widgets.LocationBoxPhone.val().replace(/[^0-9]/g, ''),
                                    address1: Widgets.LocationBoxAddress1.val().trim(),
                                    address2: Widgets.LocationBoxAddress2.val().trim() || null,
                                    cityName: Widgets.LocationBoxCity.val().trim(),
                                    provinceId: parseInt(Widgets.LocationBoxProvince.val(), 10),
                                    countryId: Countries.find(C => C.code == 'Canada').id,
                                    postalCode: Widgets.LocationBoxPostal.val().trim(),
                                    timeZone: 'Eastern', // TODO: Look up
                                    isActive: true,
                                    relationType: ShipToRelType.id,
                                    affiliateId: ExtendedRetailerInfo.retailerAffiliate.id,
                                    accuracy: LocationAccuracyOptions[0].id,
                                },
                                false, 'normal', true
                            );
                    }
                    SavePromise.done(R => {
                        R.items[0].relationType = null;
                        LocationId > -1
                            ? ExistingRow.replaceWith(RenderLocation(R.items[0]))
                            : Widgets.RetailerLocations.append(RenderLocation(R.items[0]));
                        Widgets.LocationBox.addClass('non-visible');
                        Widgets.LocationBox.find('input, select').val('');
                    });
                });

            function RenderAssociate(A) {
                return `<tr data-lt-affiliate-id="${A.id}" data-lt-affiliate="${encodeURIComponent(JSON.stringify(A))}">
                    <td data-label="Name">${A.firstName} ${A.lastName}</td>
                    <td data-label="Username">${A.username}</td>
                    <td data-label="Status">${A.isActive ? 'Active' : 'Inactive'}</td>
                    <td data-label="Role">${A.jobTitle || ''}</td>
                    <td data-label="Order Products"><p class="u-transparent">none</p></td>
                    <td data-label="Plans: Register">${A.roles.some(R => R.name == 'M-Plan Registration') ? '<i class="fa fa-check grey-text"></i>' : '<p class="u-transparent">none</p>'}</td>
                    <td data-label="Plans: Modify">${A.roles.some(R => R.name == 'C-Plan Inquiry-Modify Plan') ? '<i class="fa fa-check grey-text"></i>' : '<p class="u-transparent">none</p>'}</td>
                    <td data-label="Plans: Cancel">${A.roles.some(R => R.name == 'C-Plan Inquiry-Cancel Plan') ? '<i class="fa fa-check grey-text"></i>' : '<p class="u-transparent">none</p>'}</td>
                    <td data-label="Smarter Living Plans: Enroll"><p class="u-transparent">none</p></td>
                    <td data-label="Inquiry/Reporting: Orders"><p class="u-transparent">none</p></td>
                    <td data-label="Inquiry/Reporting: Plans">${A.roles.some(R => R.name == 'M-Plan Inquiry') ? '<i class="fa fa-check grey-text"></i>' : '<p class="u-transparent">none</p>'}</td>
                    <td data-label="Inquiry/Reporting: Success Tracker"><p class="u-transparent">none</p></td>
                    <td data-label="Edit"><a class="contact-form-edit"><i class="fa fa-pencil-alt"></i></a></td>
                </tr>`;
            }
            function RenderAssociates(Associates) {
                Widgets.Associates.empty();
                if (Associates instanceof Array) {
                    Widgets.Associates.append(
                        Associates
                            .reduce(
                                (A, Affl) => {
                                    if (!A.find(Affl2 => Affl2.id == Affl.id)) { // unique so far
                                        // get any duplicates and reduce all locationId fields to locationIds array
                                        Affl.locationIds = Associates.filter(Affl2 => Affl2.id == Affl.id).map(Affl2 => Affl2.locationId);
                                        delete Affl.locationId;
                                        A.push(Affl);
                                    }
                                    return A;
                                },
                                []
                            )
                            .reduce((A, Assoc) => A += RenderAssociate(Assoc), '')
                    );
                }
            }
            Widgets.Associates = $('.retailer-people tbody');
            RenderAssociates(ExtendedRetailerInfo.associates);
            function OpenAssociateBox() {
                Widgets.AssociateBox.removeAttr('data-lt-affiliate-id');
                Widgets.AssociateBox.removeClass('non-visible');
                Widgets.AssociateBox.find('input, select').val('');
                Widgets.AssociateBox.find('input[type="checkbox"]:eq(0)').prop('checked', true);
                Widgets.AssociateBox.find('input[type="checkbox"]:gt(0)').prop('checked', false);
            }
            Widgets.Associates.on('click', '.contact-form-edit', function () {
                OpenAssociateBox();
                // set data
                var Data = JSON.parse(decodeURIComponent($(this).closest('tr').attr('data-lt-affiliate')));
                Widgets.AssociateBox.attr('data-lt-affiliate-id', Data.id);
                Widgets.AssociateFirstName.val(Data.firstName);
                Widgets.AssociateLastName.val(Data.lastName);
                Widgets.AssociateEmail.val(Data.email);
                Widgets.AssociatePhone.val(Data.mobilePhone || Data.homePhone || Data.workPhone);
                Widgets.AssociateUsername.val(Data.username).prop('readonly', true);
                Widgets.AssociateLocations.val(Data.locationIds);
                Widgets.AssociateJobTitle.val(Data.jobTitle || '');
                Widgets.AssociateIsActive.prop('checked', Data.isActive);
                Widgets.AssociateLangPref.val(Data.preferredLanguageId);
                Widgets.AssociateBox.find('input[type="checkbox"][data-lt-role-name]').each(function () {
                    var Elem = $(this);
                    var RoleName = Elem.attr('data-lt-role-name');
                    Elem.prop('checked', !!Data.roles.find(R => R.name == RoleName));
                });
            });

            Widgets.AddAssociateBtn = $('.contact-form-button').on('click', () => {
                OpenAssociateBox();
                Widgets.AssociateJobTitle.val('Advisor');
            });
            Widgets.AssociateBox = $('.contacts-form-modal');
            Widgets.AssociateFirstName = Widgets.AssociateBox.find('input[name="person-first-name"]');
            Widgets.AssociateLastName = Widgets.AssociateBox.find('input[name="person-last-name"]');
            Widgets.AssociateFirstName.add(Widgets.AssociateLastName).on('change', function () {
                if (!Widgets.AssociateBox.attr('data-lt-affiliate-id')) {
                    var AFN = Widgets.AssociateFirstName.val().trim();
                    var ALN = Widgets.AssociateLastName.val().trim();
                    if (AFN && ALN) {
                        var SuggestedUsername = `${AFN.substr(0, 1)}${ALN}`.toLowerCase().replace(/[^a-z]/g, '');
                        if (SuggestedUsername) {
                            Widgets.AssociateUsername.val(SuggestedUsername).trigger('change');
                        }
                    }
                }
            });
            var GetUniqueFullName = function () {
                var AttemptCount = 0;
                return function (FullName, Recur) {
                    if (!Recur) AttemptCount = 0;
                    if (FullName) {
                        AttemptCount++;
                        if (AttemptCount < 4) {
                            U.LoadingSplash.Show();
                            return $.when(
                                U.AJAX('/API/Account/DoesUserNameExist/' + FullName, 'GET', false, false, 'silent').then(R => !R),
                                U.AJAX(`/API/FieldService/GetAffiliateFullNameSuggestions?fullName=${FullName}&id=-1`, 'GET', false, false, 'silent').then(R => R[0] === FullName)
                            ).then((UsernameOK, FullNameOK) => {
                                if (UsernameOK && FullNameOK) {
                                    U.LoadingSplash.Hide();
                                    return new $.Deferred().resolve(FullName);
                                } else {
                                    return GetUniqueFullName(FullName + U.GetRandomIntegerInRange(1, 99), true);
                                }
                            });
                        } else {
                            return new $.Deferred().resolve('');
                        }
                    }
                };
            }();
            Widgets.AssociateUsername =
                Widgets.AssociateBox.find('input[name="person-username"]').on('change', function () {
                    var Val = Widgets.AssociateUsername.val().trim();
                    if (Val.length) {
                        GetUniqueFullName(Val).then(R => {
                            Widgets.AssociateUsername.val(R);
                            if (R == '') alert('Try another username.');
                        });
                    }
                });
            Widgets.AssociateIsActive = Widgets.AssociateBox.find('input[name="person-status"]');
            Widgets.AssociateEmail = Widgets.AssociateBox.find('input[name="person-email"]');
            Widgets.AssociatePhone = Widgets.AssociateBox.find('input[name="person-phone"]');
            Widgets.AssociateLocations = Widgets.AssociateBox.find('select[name="person-locations"]');
            Widgets.AssociateJobTitle = Widgets.AssociateBox.find('select[name="person-role"]');
            Widgets.AssociateLangPref = Widgets.AssociateBox.find('select[name="person-language-pref"]');
            Languages.forEach(L => { Widgets.AssociateLangPref.append(`<option value="${L.id}">${L.description}</option>`) });
            ExtendedRetailerInfo.locations.forEach(L => { Widgets.AssociateLocations.append(`<option value="${L.id}">${L.name}</option>`) })
            var SRSRoleNames =
                [
                    'C-Plan Inquiry-Cancel Plan',
                    'C-Plan Inquiry-Modify Plan',
                    'M-Plan Inquiry',
                    'M-Plan Registration',
                    'M-Retailer Profile'
                ];
            function MaintainUserRoles(Username, Roles) {
                return U.AJAX('/API/Account/GetAffiliateUserInfoByUserName/' + Username, 'GET', false, false, 'silent').then(R => {
                    R.selectedRoles =
                        Roles
                            .map(Name => AvailableRoles.find(AR => AR.name == Name))
                            .sort((A, B) => A.name > B.name ? 1 : A.name < B.name ? -1 : 0)
                            .reduce((A, R) => { if (!A.find(R2 => R2.name == R.name)) A.push(R); return A; }, []);
                    R.roles.sort((A, B) => A.name > B.name ? 1 : A.name < B.name ? -1 : 0);
                    // lengths equal and 0 differences?
                    if (R.selectedRoles.length != R.roles.length || R.selectedRoles.reduce((A, SR, I) => SR.name != R.roles[I].name ? ++A : A, 0) > 0) {
                        R.affiliateId = R.id;
                        delete R.id;
                        R.currentTimeZoneId = R.currentTimeZone;
                        delete R.currentTimeZone;
                        R.homeTimeZoneId = R.homeTimeZone;
                        delete R.homeTimeZone;
                        // re-include any non-SRS roles that have been added elsewhere
                        R.roles.forEach(Role => {
                            if (SRSRoleNames.indexOf(Role.name) < 0) {
                                R.selectedRoles.push(Role);
                            }
                        });
                        R.selectedRoles = R.selectedRoles.map(Role => Role.id);
                        delete R.roles;
                        return U.AJAX('/API/Account/ManageUser', 'POST', R, false, 'silent');
                    }
                });
            }
            function MaintainAffiliateLocations(AffiliateId, LocationIdList) {
                if (LocationIdList instanceof Array) {
                    return U.AJAX(`/API/Core/AffiliateLocations/-1/null/null/${AccountManagerRelType.id}?geofenceIdListString=&$filter=affiliateId eq ${AffiliateId}`, 'GET', false, false, 'silent').then(R => {
                        return $.when(
                            // add
                            $.when.apply(
                                null,
                                LocationIdList.reduce((A, LId) => {
                                    if (!R.items.find(AL => AL.locationId == LId)) {
                                        A.push(U.AJAX(
                                            '/API/Core/AffiliateLocations', 'POST',
                                            {
                                                affiliateId: AffiliateId,
                                                locationId: LId,
                                                relationType: AccountManagerRelType.id,
                                            },
                                            false, 'silent', true
                                        ));
                                    }
                                    return A;
                                }, [{}])
                            ),
                            // delete
                            $.when.apply(
                                null,
                                R.items.reduce((A, AL) => {
                                    if (!LocationIdList.find(LId => LId == AL.locationId)) {
                                        A.push(
                                            U.AJAX(
                                                `/API/Core/AffiliateLocations(${AL.id})`, 'DELETE',
                                                false, false, 'silent'
                                            )
                                        );
                                    }
                                    return A;
                                }, [{}])
                            )
                        );
                    });
                } else {
                    throw new Error('Please pass a list of LocationIds to associate. (Can be empty to remove all.)');
                }
            }
            Widgets.AssociateBoxSave =
                $('.person-save-btn').on('click', function () {
                U.AJAX(`/API/Core/Alerts?$filter=name eq '${Widgets.AssociateJobTitle.val()}' and isEnabled eq true`, 'GET', false, false, 'silent').done((R) => {

                    if (R && R.items && R.items.length > 0) {
                        const alertId = R.items[0].id;

                        var AffiliateId = parseInt(Widgets.AssociateBox.attr('data-lt-affiliate-id'), 10) || -1;
                        var Username = Widgets.AssociateUsername.val().trim();
                        var SavePromise = null;
                        U.LoadingSplash.Show();
                        if (AffiliateId > -1) {
                            SavePromise = U.AJAX('/API/Core/Affiliates?$filter=id eq ' + AffiliateId, 'GET', false, false, 'silent').then(R => R.items[0]);
                        } else {
                            var TimeZone = ExtendedRetailerInfo.retailerAffiliate.homeTimeZone;
                            SavePromise =
                                U.AJAX(
                                    '/API/Account/CreateNewExternalUserAccountForNewAffiliate', 'POST',
                                    {
                                        firstName: Widgets.AssociateFirstName.val().trim(),
                                        lastName: Widgets.AssociateLastName.val().trim(),
                                        fullName: Username,
                                        userName: Username,
                                        email: Widgets.AssociateEmail.val().trim(),
                                        currentTimeZoneId: TimeZone,
                                        homeTimeZoneId: TimeZone,
                                        currencyId: ExtendedRetailerInfo.retailerAffiliate.currencyId,
                                        alertId: alertId
                                    },
                                    false, 'silent', true
                                ).then(() => U.AJAX(`/API/Core/Affiliates?$filter=fullName eq '${Username}'`, 'GET', false, false, 'silent').then(R => R.items[0]));
                        }
                        SavePromise.done(Affiliate => {
                            var Roles = $.map(
                                Widgets.AssociateBox.find('[data-lt-role-name]:checked'),
                                Elem => $(Elem).attr('data-lt-role-name')
                            );
                            var LocationIds = Widgets.AssociateLocations.val().map(LId => parseInt(LId, 10));
                            U.AJAX(
                                `/API/Core/Affiliates(${Affiliate.id})`, 'PUT',
                                $.extend(
                                    Affiliate,
                                    {
                                        firstName: Widgets.AssociateFirstName.val().trim(),
                                        lastName: Widgets.AssociateLastName.val().trim(),
                                        email: Widgets.AssociateEmail.val().trim(),
                                        mobilePhone: Widgets.AssociatePhone.val().trim(),
                                        preferredCommunication: PrefCommNone.id,
                                        preferredLanguageId: Widgets.AssociateLangPref.val(),
                                        jobTitle: Widgets.AssociateJobTitle.val() || null,
                                    }
                                ),
                                false, 'silent', true
                            )
                                .then(() => MaintainAffiliateLocations(Affiliate.id, LocationIds))
                                .then(() => MaintainUserRoles(Username, Roles))
                                .then(() => {
                                    var IsActive = Widgets.AssociateIsActive.is(':checked');
                                    var ExistingAssociate = ExtendedRetailerInfo.associates.find(A => A.id == Affiliate.id) || null;
                                    if ((!ExistingAssociate && !IsActive) || (ExistingAssociate && ExistingAssociate.isActive && !IsActive)) { // deactivate
                                        return U.AJAX('/API/Account/InactivateUser/' + Affiliate.id, 'POST', false, false, 'silent');
                                    } else if (ExistingAssociate && !ExistingAssociate.isActive && IsActive) { // reactivate
                                        return U.AJAX('/API/Account/ReactivateUser/' + Affiliate.id, 'POST', false, false, 'silent')
                                            .then(() => { alert('An email has been sent to the user with reactivation instructions. The account will become Active after the user completes reactivation.') });
                                    }
                                })
                                .then(() => U.AJAX('/API/Core/GetRetailerDatas', 'GET', false, false, 'silent'))
                                .then(R => {
                                    ExtendedRetailerInfo.associates = R.associates;
                                    RenderAssociates(ExtendedRetailerInfo.associates);
                                })
                                .then(() => {
                                    U.LoadingSplash.Hide()
                                    Widgets.AssociateBox.addClass('non-visible');
                                    Widgets.AssociateBox.find('input, select').val('');
                                    Widgets.AssociateBox.find('input[type="checkbox"]:eq(0)').prop('checked', true);
                                    Widgets.AssociateBox.find('input[type="checkbox"]:gt(0)').prop('checked', false);
                                });
                        });
                    }
                    else {
                        alert(`No alert has been set up for ${Widgets.AssociateJobTitle.val()}. Please set up the alert first and try again.`);
                    }

                    });
                });

            U.ShowUI();

        });
    });

})();
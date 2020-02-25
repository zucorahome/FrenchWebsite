/*

    repprofile Controller for the View "repprofile"
    Copyright 2019, LimeTAC Inc. All rights reserved.

*/

(function () {

    var U = new LTPublicUtils();

    $.when(
        LT.LTCodes.Get('CanadianProvinceList').then(R => R.sort((A, B) => { var AU = A.code.toUpperCase(), BU = B.code.toUpperCase(); return AU > BU ? 1 : AU < BU ? -1 : 0; })),
        LT.LTCodes.Get('Countries'),
        LT.LTCodes.Get('Currencies'),
        LT.LTCodes.Get('LocationAccuracyOptions'),
        LT.LTCodes.Get('AffiliateLocationRelationTypeOptions'),
        LT.LTCodes.Get('LocationCategories'),
        LT.LTCodes.Get('CurrentUserDetails'),
        LT.LTCodes.Get('MarketSegments'),
        LT.LTCodes.Get('SimpleEntityCodeStatusOptions'),
    ).then((CanadianProvinceList, Countries, Currencies, LocationAccuracyOptions, AffiliateLocationRelationTypeOptions, LocationCategories, CurrentUserDetails, MarketSegments, SimpleEntityCodeStatusOptions) => {
        $(function () {

            var Widgets = {};
            Widgets.Address1 = $('input[id="rp-address-1"]');
            Widgets.Address2 = $('input[id="rp-address-2"]');
            Widgets.FirstName = $('input[id="rp-first-name"]');
            Widgets.BusinessLegalName = $('input[id="rp-business-legal-name"]');
            Widgets.LastName = $('input[id="rp-last-name"]');
            Widgets.Phone = $('input[id="rp-phone"]');
            Widgets.Email = $('input[id="rp-email"]');
            Widgets.PostalCode = $('input[id="mp-details-postal"]');
            Widgets.Province = $('select[id="rp-province"]');
            Widgets.InstitutionNumber = $('input[id="rp-institution-number"]');
            Widgets.TransitNumber = $('input[id="rp-transit-number"]');
            Widgets.AccountNumber = $('input[id="rp-account-number"]');
            Widgets.HSTGST = $('input[id="rp-hst-gst-number"]');
            Widgets.FinancialDetailsModal = $('.rp-financial-details-modal-container');
            Widgets.PartnerProfilesList = $('.rp-partner-profiles tbody');
            CanadianProvinceList.forEach(P => {
                Widgets.Province.append(`<option value="${P.id}">${P.code}</option>`);
            });
            Widgets.FirstName.val(CurrentUserDetails.firstName);
            Widgets.LastName.val(CurrentUserDetails.lastName);
            Widgets.BusinessLegalName.val(CurrentUserDetails.fullName);
            Widgets.Email.val(CurrentUserDetails.email);
            Widgets.Phone.val(CurrentUserDetails.mobilePhone);
            U.AJAX(`/API/FieldService/Zuc/RepProfile/GetCurrentUserHomeLocation`, 'GET', false, false, 'silent').then(function (R) {
                if (R) {
                    Widgets.Address1.val(R.address1);
                    Widgets.Address2.val(R.address2);
                    Widgets.City.val(R.city);
                    Widgets.PostalCode.val(R.postalCode);
                    Widgets.Province.val(R.provinceId);
                }
                
            })
            
            U.AJAX('/API/FieldService/Zuc/RepProfile/GetCurrentUserBankAccount', 'GET', false, false, 'silent').then(function (R) {
                if (R) {
                    Widgets.InstitutionNumber.val(R.institutionNumber);
                    Widgets.TransitNumber.val(R.transitNumber);
                    Widgets.AccountNumber.val(R.accountNumber);
                    Widgets.HSTGST.val(R.institutionName);
                }
            });

        
            CanadianProvinceList.forEach(P => {
                Widgets.Province.append(`<option value="${P.id}">${P.code}</option>`);
            });
            Widgets.FinancialDetailIcon = $('.rp-financial-details-info-icon').on('click', function () {
                Widgets.FinancialDetailsModal.removeClass('non-visible');
            });
            Widgets.FinancialDetailsModal.on('click', '.close-modal', function () {
                Widgets.FinancialDetailsModal.addClass('non-visible');
            });
            new LT.GoogleAutoComplete.Locate({
                Element: Widgets.Address1[0],
                LocateCallback: function (Loc) {
                    Widgets.Address1.val(Loc.Address1);
                    Widgets.City.val(Loc.CityName);
                    Widgets.PostalCode.val(Loc.PostalCode);
                    var province = CanadianProvinceList.find(x => x.code == Loc.ProvinceName);
                    //var country = Countries.find(x => x.code == Loc.CountryName);
                    if (province) {
                        Widgets.Location_Province.val(province.id);
                    }
                    //if (country) {
                    //    Widgets.Location_Country.val(country.id);
                    //}
                    //Widgets.Province = $('input[name="mp-details-province"]');
                },
            });

            MarketSegments.forEach(M => {
                Widgets.PartnerProfilesList.append(
                    `<tr id='SelectMarketSegment${M.id}'>
                                    <td data-label="Name">${M.code}</td>
                                    <td data-label="Status">${SimpleEntityCodeStatusOptions.find(x => x.id == M.status).code}</td >
                                </tr>`
                );
            });

            U.ShowUI();

        });
    });

})();
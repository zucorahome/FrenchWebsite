/*

    spswelcome Controller for the View "spswelcome"
    Copyright 2019, LimeTAC Inc. All rights reserved.

*/

(function () {

    var U = new LTPublicUtils();

    $.when(
        U.AJAX('/API/Core/GetRetailerDatas', 'GET', false, false, 'silent').then(R => R),
        LT.LTCodes.Get('CurrentUserDetails')
    ).done(function (RetailerData, CurrentUserDetails) {
        $(function () {

            var Widgets = {};
            Widgets.UserFirstName = $('.user-first-name').text(CurrentUserDetails.firstName);
            Widgets.EmployerFullName = $('.employer-full-name').text(RetailerData.retailerAffiliate.fullName);

            U.ShowUI();

        });
    });

})();
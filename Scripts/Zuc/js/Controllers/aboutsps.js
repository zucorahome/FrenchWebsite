/*

    aboutsps Controller for the View "aboutsps"
    Copyright 2020, LimeTAC Inc. All rights reserved.

*/

(function () {

    var U = new LTPublicUtils();

    var Token = U.GetURIParam('key');

    $.when(
        Token
            ? $.ajax({
                url: '/api/MarketPartner/GetMarketPartnerAssociationDefaults/' + Token,
                type: 'GET',
                dataType: 'json',
            }).then(
                R => 'Valid',
                R => R && R.responseJSON && R.responseJSON.message == 'Under Review!' ? 'Submitted' : 'Invalid'
            )
            : 'None'
    ).then(TokenStatus => {
        $(function () {

            var Widgets = {};

            Widgets.Register = $('.as-register').hide();
            if (TokenStatus == 'Valid') {
                Widgets.Register.on('click', function () {
                    window.location.href = '/zuc/smarterpartnersetup?key=' + Token;
                });
                Widgets.Register.show();
            } else if (TokenStatus == 'Submitted') {
                $('.as-under-review-container').removeClass('non-visible').on('click', '.close-modal', function () {
                    $(this).closest('.as-under-review-container').addClass('non-visible');
                });
            }

            U.ShowUI();

        });
    });

})();
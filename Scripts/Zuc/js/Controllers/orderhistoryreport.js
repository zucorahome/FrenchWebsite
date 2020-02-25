/*

    orderhistoryreport Controller for the View "orderhistoryreport"
    Copyright 2020, LimeTAC Inc. All rights reserved.

*/

(function () {

    var U = new LTPublicUtils();
    var CurrentYear = new Date().getFullYear();

    $.when(
        U.AJAX('/API/Core/GetRetailerDatas', 'GET', false, false, 'silent').then(R => R),
        U.AJAX(`/API/Core/MarketPartner/GetMarketPartnersAffiliates/-1`).then(R => R),
        U.AJAX(`/API/Core/MarketPartner/GetShippingLocations`).then(R => R),
        LT.LTCodes.Get('ShipViaList'),


    ).done(function (RetailerData, MarketPartners, ShippingLocations, ShipViaList) {

        $(function () {

            var Widgets = {};
            Widgets.OrderHistoryData = null;
            
            Widgets.FromDate = $('#ohr-from-date');
            Widgets.ToDate = $('#ohr-to-date');
            Widgets.MarketPatner = $('#ohr-partner');
            Widgets.ShippingLocation = $('#ohr-location');
            Widgets.FilterButton = $('.filterConditions-query-button');

            Widgets.OrdersTable = $('.ohr-orders');// Order Table


            Widgets.Init = function () {

                ShippingLocations.forEach(location => {
                    var HTML = `<option value="${location.id}">${location.name}</option>`;
                    Widgets.ShippingLocation.append(HTML);
                });

                MarketPartners.affiliates.forEach(partner => {
                    var HTML = `<option value="${partner.id}">${partner.fullName}</option>`;
                    Widgets.MarketPatner.append(HTML);
                });

            }();


            Widgets.FilterButton.on('click', function () {
                Widgets.FilterOrders();
            });

            Widgets.FilterOrders = function () {

                let filter = 'Count=100'
                filter += Widgets.FromDate.val() ? `&FromDate=${Widgets.FromDate.val()}`: '' ;
                filter += Widgets.ToDate.val() ? `&ToDate=${Widgets.ToDate.val()}`: '' ;
                filter += Widgets.MarketPatner.val() ? `&PartnerId=${Widgets.MarketPatner.val()}`: '' ;
                filter += Widgets.ShippingLocation.val() ? `&ShippingLocationId=${Widgets.ShippingLocation.val()}`: '' ;
              

                U.AJAX(`/API/SalesOrderManagement/v1/GetOrders?${filter}`, 'GET', false, false, 'silent').then(R => {
                    Widgets.OrderHistoryData = R;
                    Widgets.RenderOrders();
                });
            }

            Widgets.RenderOrders = function () {
                $(".new-planAdd-detail").show();
                var TBody = Widgets.OrdersTable.find(`tbody`);
                TBody.find('tr').remove();
                var RowHTML = "";
                if (Widgets.OrderHistoryData && Widgets.OrderHistoryData.productOrders && Widgets.OrderHistoryData.productOrders.length > 0) {
                    Widgets.OrderHistoryData.productOrders.forEach(Data => {
                        RowHTML += `<tr class="new-itemAdd" data-lt-model="${encodeURIComponent(JSON.stringify(Data))}" data-lt-id="" >
                            <td data-label="Date">${Data.date ? Data.date.substring(0, 10) : undefined || ''}</td>
                            <td data-label="Customer">${Data.customerFullName || ''}</td>
                            <td data-label="Location">${Data.shippingLocationName || ''}</td>
                            <td data-label="OrderId">${Data.orderId || ''}</td>
                            <td data-label="PORef">${Data.poRef || ''}</td>
                            <td data-label="MarketPartner">${Data.marketPartner || ''}</td>
                            <td data-label="OrderValue">$${Data.value.toFixed(2)}</td>
                            <td data-label="ShipVia">${(Data.shipViaId ? ShipViaList.find(x => x.id == Data.shipViaId).code : null )|| ''}</td>
                            <td data-label="Units">${Data.freight.toFixed(2)}</td>
                            <td data-label="Units">${Data.tax.toFixed(2)}</td>
                            <td data-label="Units">${Data.total.toFixed(2)}</td>
                        </tr>`;
                    });
                }
                $(RowHTML).appendTo(TBody); // add
            };

            U.ShowUI();

        });
    });

})();
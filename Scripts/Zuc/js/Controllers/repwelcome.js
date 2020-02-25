/*

    repwelcome Controller for the View "repwelcome"
    Copyright 2019, LimeTAC Inc. All rights reserved.

*/

(function () {

    var U = new LTPublicUtils();

    $.when(
        U.AJAX('/API/Core/GetRetailerDatas', 'GET', false, false, 'silent').then(R => R),
        U.AJAX('/API/SalesOrderManagement/v1/GetOrders?Count=5', 'GET', false, false, 'silent').then(R => R),
        U.AJAX('/API/MarketPartner/GetCurrentUserTier')
    ).done(function (RetailerData, LandingPageData, Tier) {
        $(function () {

             
            var Widgets = {};

            // Page Widgets
            Widgets.LandingPageContainer = $('.rep-landingPage-container');
            Widgets.PromoGraphic =
                $('.rw-promo-graphic', Widgets.LandingPageContainer)
                    .attr(
                        'src',
                        Tier === 1
                            ? 'https://zuchomelimetacstorage.blob.core.windows.net/docs/Rep_LandingPage.png_bf30784f-a18f-4860-b300-880c27bd2e6c.png'
                            : 'https://zuchomelimetacstorage.blob.core.windows.net/docs/Partner_LandingPage.png_53ca38aa-cf98-4ae2-8214-b28939e46a25.png'
                    );
            Widgets.OrdersTable = $('.rw-orders');// Order Table
            Widgets.TransactionTable = $('.rw-transactions');// Transaction Table

            Widgets.RenderProductOrders = function () {
                var TBody = Widgets.OrdersTable.find(`tbody`);
                //const uniqueId = U.GenerateUniqueString();

                var RowHTML = "";
                if (LandingPageData.productOrders && LandingPageData.productOrders.length > 0) {
                    LandingPageData.productOrders.forEach(Data => {
                        RowHTML += `<tr class="new-itemAdd" data-lt-model="${encodeURIComponent(JSON.stringify(Data))}" data-lt-id="" >
                            <td data-label="Date">${Data.date ? Data.date.substring(0, 10) : undefined || ''}</td>
                            <td data-label="PORef">${Data.poRef || ''}</td>
                            <td data-label="Units">${Data.units.toFixed(2)}</td>
                            <td data-label="Value">$${Data.value.toFixed(2)}</td>
                            <td data-label="MarketPartner">${Data.marketPartner || ''}</td>
                            <td data-label="Status">${Data.status || ''}</td>
                            <td data-label="Confirmation">${Data.confirmation|| ''}</td>
                        </tr>`;
                    });
                }

                $(RowHTML).appendTo(TBody); // add
              


            }();

            Widgets.RenderTransactions = function () {
                var TBody = Widgets.TransactionTable.find(`tbody`);
                //const uniqueId = U.GenerateUniqueString();

                var RowHTML = "";
                if (LandingPageData.statementOfAccounts && LandingPageData.statementOfAccounts.length > 0) {
                    LandingPageData.statementOfAccounts.forEach(Data => {
                        RowHTML += `<tr class="new-itemAdd" data-lt-model="${encodeURIComponent(JSON.stringify(Data))}" data-lt-id="" >
                            <td data-label="Date">${Data.transactionTime ? Data.transactionTime.substring(0, 10) : undefined || ''}</td>
                            <td data-label="PORef">${Data.transactionDescription || ''}</td>
                            <td data-label="DueDate">${Data.dueDate ? Data.dueDate.substring(0, 10) : undefined || ''}</td>
                            <td data-label="Units">${Math.abs(Data.amount.toFixed(2))}</td>
                            <td data-label="Value">$${Math.abs(Data.balance.toFixed(2))}</td>
                        </tr>`;
                    });
                }

                $(RowHTML).appendTo(TBody); // add



            }();

            Widgets.RenderProtectionPlan = function () {
                var TBody = Widgets.OrdersTable.find(`tbody`);
                //const uniqueId = U.GenerateUniqueString();

                var RowHTML = "";
                if (LandingPageData.productProtectionPlans && LandingPageData.productProtectionPlans.length > 0) {
                    LandingPageData.productProtectionPlans.forEach(Data => {
                        RowHTML += `<tr class="new-itemAdd" data-lt-model="${encodeURIComponent(JSON.stringify(Data))}" data-lt-id="" >
                            <td data-label="InvoiceNumber">${Data.invoiceNumber || ''}</td>
                            <td data-label="InvoiceDate">${Data.invoiceDate || ''}</td>
                            <td data-label="Status">${Data.status}</td>
                            <td data-label="Amount">$${Data.amount.toFixed(2)}</td>
                            <td data-label="MarketPartner">${Data.marketPartner || ''}</td>
                         
                        </tr>`;
                    });
                }

                $(RowHTML).appendTo(TBody); // add



            }();

            $(".rw-orders-view-all").on("click", function () {
                window.open('orderhistoryreport');
            });

            U.ShowUI();

        });
    });

})();
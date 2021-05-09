
var delay = (function () {
    var timer = 0;
    return function (callback, ms) {
        clearTimeout(timer);
        timer = setTimeout(callback, ms);
    };
})();


$(document).ready(function (e) {
    $('#chain-network').change(function () {
        $('.asset-item').remove();
        $('.wallet-item.currency').remove();
        $('.wallet-name').text('...');
        $('.tokens-count span').text('0');
        $('.account-count span').text('0');
        $('.notify-status').removeClass('text-warning text-success').addClass('text-danger').text('No Listening ...');
        $('#wallet-name-sel').val('');
    });
    function showSpinner(parent, type) {
        var $spinner = '<div class="spinner-border" role="status"> ' +
            '    <span class="sr-only">Loading...</span>' +
            '</div>                                     ';
        parent.append($spinner);
    }
    function hideSpinner(parent, type) {
        parent.find('.spinner-border').remove();
    }
    function showToast(title, message) {

        $('.toast .toast-header strong').html(title);
        $('.toast .toast-body').html(message);
        $('.toast').toast('show');
        $('.toast-wrap').css('display', 'flex');
        $('.toast-wrap').removeClass('d-none');
    }
    $('.toast').on('hidden.bs.toast', function () {
        $('.toast-wrap').css('display', 'none');
        $('.toast-wrap').addClass('d-none');
    });
    $('#create-wallet').click(function () {
        var this_ = $(this);
        showSpinner(this_, '');

        // true: mainnet
        // false: testnet
        var chain_network = $('#chain-network').prop('checked');
        var walletName = $('#wallet-name').val();
        if (walletName === null || walletName === undefined || walletName === '') {
            showToast('Error', 'Please type the wallet name');
            hideSpinner(this_, '');
        } else {
            delay(function () {
                $.ajax({
                    type: "POST",
                    data: { walletname: walletName, chainnetwork: chain_network },
                    url: "/createwallet",
                    success: function (result) {
                        if (result.status === "success") {
                            $('#curret-wallet').val(result.walletname);
                            $('.wallet-name').text(result.walletname);
                            showToast('Wallet Created', result.message);
                            showToast('Wallet Selected', result.walletname + ' is selected');
                            hideSpinner(this_, '');
                            getAssets(this_, chain_network, walletName);
                        }
                        else if (result.status === "error") {
                            showToast('Error', result.message);
                            hideSpinner(this_, '');
                        }

                    },
                    error: function () {

                    }
                });
            }, 500);
        }
    });

    $('#select-wallet').click(function () {

        var this_ = $(this);
        // true: mainnet
        // false: testnet
        var chain_network = $('#chain-network').prop('checked');
        var walletName = $('#wallet-name-sel').val();
        $('#curret-wallet').val(walletName);
        $('.wallet-name').text(walletName);

        if (walletName === null || walletName === undefined || walletName === '') {
            showToast('Error', 'Please select the wallet name');
            hideSpinner(this_, '');
        } else {
            getAssets(this_, chain_network, walletName);
            showToast('Wallet Selected', walletName + ' is selected');
        }

    });

    $('#get-accounts').click(function () {
        var this_ = $(this);
        showSpinner(this_, '');
        // true: mainnet
        // false: testnet
        var chain_network = $('#chain-network').prop('checked');
        delay(function () {
            $.ajax({
                type: "POST",
                data: { chainnetwork: chain_network },
                url: "/getaccounts",
                success: function (result) {
                    if (result.status === "success") {
                        var addresses = result.accounts;
                        $('.account-count span').text(addresses.length);
                        $('.asset-list').empty();
                        $.each(addresses, function (index, element) {
                            $('.asset-list').prepend(
                                '<div class="asset-item" data-address="' + element.toLowerCase() + '">                                                                   ' +
                                '    <div class="asset-card">                                                               ' +
                                '        <div class="asset-1">                                                              ' +
                                '            <div class="asset-info">                                                       ' +
                                '                <p class="asset-name">Address</p>                                          ' +
                                '                <p class="asset-address">' + element + '</p>                                 ' +
                                '            </div>                                                                         ' +
                                '        </div>                                                                             ' +
                                '        <div class="asset-history" data-tx-count=0>                                                        ' +
                                '            <p class="asset-history-title">Transactions</p>                                ' +
                                '            <div class="asset-transactions">                                               ' +
                                '            <p class="asset-transaction">                                                  ' +
                                'No new tx' +
                                '            </p>                                                                           ' +
                                '            </div>                                                                           ' +
                                '        </div>                                                                             ' +
                                '    </div>                                                                                 ' +
                                '</div>                                                                                     '
                            );
                        });

                        startNotiy(this_, chain_network);
                    }
                    else if (result.status === "error") {
                        showToast('Error', result.message);
                    }
                    hideSpinner(this_, '');
                },
                error: function () {

                }
            });
        }, 500);

    });

    function getAssets(this_, chain_network, walletName) {
        showSpinner(this_, '');

        delay(function () {
            $.ajax({
                type: "POST",
                data: { walletname: walletName, chainnetwork: chain_network },
                url: "/getassets",
                success: function (result) {
                    if (result.status === "success") {
                        var assets = result.assets;
                        $('.tokens-count span').text(assets.length);
                        $('.wallet .wallet-item.currency').remove();
                        $.each(assets, function (index, element) {
                            $('.wallet').append(
                                '<div class="wallet-item currency" data-asset-code="' + element.symbol + '">                                                          ' +
                                '    <div class="wallet-card">                                                      ' +
                                '        <div class="asset-detail">                                                 ' +
                                '            <p class="asset-name">                                                 ' +
                                '                ' + element.name + '                                                            ' +
                                '            </p>                                                                   ' +
                                '            <p class="asset-code">                                                 ' +
                                '                ' + element.symbol + '                                                                ' +
                                '            </p>                                                                   ' +
                                '            <p class="asset-balance">                                              ' +
                                '                <span class="bal">                                                 ' +
                                '                    <span class="curr-bal">' + element.balance.toFixed(8) + '</span>                 ' +
                                '                </span>                                                            ' +
                                '            </p>                                                                   ' +
                                '            <p class="wallet-operation">                                           ' +
                                '                <button class="btn-withdraw btn btn-sm btn-outline-danger">Withdraw</button>    ' +
                                '            </p>                                                                   ' +
                                '        </div>                                                                     ' +
                                '    </div>                                                                         ' +
                                '</div>                                                                             '
                            );
                        });

                        loadBtnWithdraw();
                    } else if (result.status === "error") {
                        showToast('Error', result.message);
                    }

                    hideSpinner(this_, '');
                },
                error: function () {
                    hideSpinner(this_, '');
                }
            });
        }, 500);
    }

    function loadBtnWithdraw() {
        $('.btn-withdraw').click(function () {

            var this_ = $(this);


            var asset = this_.closest('.wallet-item.currency').attr('data-asset-code');
            $('#curret-asset').val(asset);

            showToast('Withdraw ' + asset.toUpperCase(), $('#modal-withdraw').html());
            $('.toast .withdraw-form').removeClass('d-none');

            loadBtnWithdrawConfirm();

        });
    }
    function loadBtnWithdrawConfirm() {
        $('.btn-withdraw-confirm').click(function () {

            var this_ = $(this);
            showSpinner(this_, '');

            // true: mainnet
            // false: testnet
            var chain_network = $('#chain-network').prop('checked');
            var walletName = $('#wallet-name-sel').val();
            var asset = $('#curret-asset').val();
            var toaddress = $('#to-address').val();
            var amount = $('#amount').val();

            delay(function () {
                $.ajax({
                    type: "POST",
                    data: {
                        walletname: walletName,
                        chainnetwork: chain_network,
                        asset: asset,
                        toaddress: toaddress,
                        amount: amount
                    },
                    url: "/sendtoaddress",
                    success: function (result) {
                        if (result.status === "success") {
                            var etherscanurl = "";
                            if (chain_network) {
                                etherscanurl = "https://etherscan.io/tx/";
                            }
                            else {
                                etherscanurl = "https://ropsten.etherscan.io/tx/";
                            }
                            showToast(
                                'Success, TxHash:',
                                '<a href="' + etherscanurl + result.message + '" target="_blank">' +
                                result.message +
                                '</a>'
                            );
                        }
                        else if (result.status === "error") {
                            showToast('Error', result.message);
                        }
                        hideSpinner(this_, '');
                    },
                    error: function () {

                    }
                });
            }, 500);
        });
    }


    $('#generate-address').click(function () {

        var this_ = $(this);
        showSpinner(this_, '');

        // true: mainnet
        // false: testnet
        var chain_network = $('#chain-network').prop('checked');
        var walletName = $('#wallet-name-sel').val();
        if (walletName === null || walletName === undefined || walletName === '') {
            showToast('Error', 'Please type the wallet name');
            hideSpinner(this_, '');
        } else {
            delay(function () {
                $.ajax({
                    type: "POST",
                    data: { walletname: walletName, chainnetwork: chain_network },
                    url: "/generateaddress",
                    success: function (result) {
                        if (result.status === "success") {
                            $('.asset-list').prepend(
                                '<div class="asset-item" data-address="' + result.address.toLowerCase() + '">                                                                   ' +
                                '    <div class="asset-card">                                                               ' +
                                '        <div class="asset-1">                                                              ' +
                                '            <div class="asset-info">                                                       ' +
                                '                <p class="asset-name">Address</p>                                          ' +
                                '                <p class="asset-address">' + result.address + '</p>                                 ' +
                                '            </div>                                                                         ' +
                                '        </div>                                                                             ' +
                                '        <div class="asset-history" data-tx-count=0>                                                        ' +
                                '            <p class="asset-history-title">Transactions</p>                                ' +
                                '            <p class="asset-transaction">                                                  ' +
                                'No new tx' +
                                '            </p>                                                                           ' +
                                '        </div>                                                                             ' +
                                '    </div>                                                                                 ' +
                                '</div>                                                                                     '
                            );

                            startNotiy(this_, chain_network);
                        }
                        else if (result.status === "error") {
                            showToast('Error', result.message);
                        }
                        hideSpinner(this_, '');
                    },
                    error: function () {

                    }
                });
            }, 500);
        }

    });


    function getNodeConfig() {
        delay(function () {
            $.ajax({
                type: "POST",
                url: "/getnodeconfig",
                success: function (result) {
                    if (result.status === "success") {
                        $('.node-url').text(result.ip);
                        $('.node-port').text(result.port);
                        $('.node-sec-key').text(result.eth_erc20_securityKey);
                    }
                    else if (result.status === "error") {
                        return;
                    }
                },
                error: function () {

                }
            });
        }, 500);
    }

    getNodeConfig();


    $('#set-node-config').click(function () {
        var this_ = $(this);

        showToast('Node API Connection Configuration', $('#modal-node-config').html());
        $('.toast .node-config-form').removeClass('d-none');
        loadBtnConfigFormConfirm();

    });

    function loadBtnConfigFormConfirm() {
        $('.btn-config-form-confirm').click(function () {
            var eth_erc20_securityKey = $('#i-sec-key').val();
            var ip = $('#i-url').val();
            var port = $('#i-port').val();
            delay(function () {
                $.ajax({
                    type: "POST",
                    data: {
                        _eth_erc20_securityKey: eth_erc20_securityKey,
                        _ip: ip,
                        _port: port
                    },
                    url: "/setnodeconfig",
                    success: function (result) {
                        window.location.href = "/";

                        $('.toast').toast('hide');
                    },
                    error: function () {
                        $('.toast').toast('hide');
                    }
                });
            }, 500);
        });
    }



    function startNotiy(this_, chain_network) {
        showSpinner(this_, '');

        $('.notify-status').removeClass('text-danger');
        $('.notify-status').addClass('text-warning');
        $('.notify-status').text('Pending ...');

        delay(function () {
            $.ajax({
                type: "POST",
                data: { chainnetwork: chain_network },
                url: "/startnotify",
                success: function (result) {
                    hideSpinner(this_, '');
                    if (result.status === "success") {
                        $('.notify-status').removeClass('text-warning');
                        $('.notify-status').addClass('text-success');
                        $('.notify-status').text('Listening ...');
                    } else if (result.status === "error") {
                        $('.notify-status').removeClass('text-warning');
                        $('.notify-status').addClass('text-danger');
                        $('.notify-status').text('No Listening ...');
                    } else {
                        $('.notify-status').removeClass('text-warning');
                        $('.notify-status').addClass('text-danger');
                        $('.notify-status').text('No Listening ...');
                    }
                },
                error: function () {
                    hideSpinner(this_, '');
                    return true;
                }
            });
        }, 500);
    }

    $('#add-contract').click(function () {
        var this_ = $(this);
        showSpinner(this_, '');

        // true: mainnet
        // false: testnet
        var chain_network = $('#chain-network').prop('checked');
        var symbol = $('#contract-symbol').val();
        var name = $('#contract-name').val();
        var address = $('#contract-address').val();
        var abi = $('#contract-abi').val();

        if (address === '') {
            showToast('Error', 'Please type the token contract address');
            hideSpinner(this_, '');
        } else if (name === '') {
            showToast('Error', 'Please type the token name');
            hideSpinner(this_, '');
        } else if (symbol === '') {
            showToast('Error', 'Please type the token symbol');
            hideSpinner(this_, '');
        } else {
            delay(function () {
                $.ajax({
                    type: "POST",
                    data: {
                        contractaddress: address,
                        symbol: symbol,
                        name: name,
                        abi: abi,
                        chainnetwork: chain_network
                    },
                    url: "/addcontract",
                    success: function (result) {
                        if (result.status === "success") {
                            showToast('Contract Added', result.message);
                            hideSpinner(this_, '');
                            listContracts(this_, chain_network);
                        }
                        else if (result.status === "error") {
                            showToast('Error', result.message);
                            hideSpinner(this_, '');
                        }
                    },
                    error: function () {

                    }
                });
            }, 500);
        }



    });

    $('#get-contract').click(function () {
        var this_ = $(this);
        showSpinner(this_, '');

        // true: mainnet
        // false: testnet
        var chain_network = $('#chain-network').prop('checked');
        var symbol = $('#get-contract-symbol').val();



        if (symbol === '') {
            showToast('Error', 'Please type the token symbol');
            hideSpinner(this_, '');
        } else {
            delay(function () {
                $.ajax({
                    type: "POST",
                    data: {
                        asset: symbol,
                        chainnetwork: chain_network
                    },
                    url: "/getcontract",
                    success: function (result) {
                        if (result.status === "success") {
                            var contract = result.contract;
                            $('.contract-count span').text(1);
                            $('.contract .contract-item.ctnr').remove();
                            var symbol = contract.symbol;
                            var name = contract.name;
                            var contractaddress = contract.contractAddress;

                            $('.contract').append(
                                '<div class="contract-item ctnr">                                                          ' +
                                '    <div class="contract-card">                                                      ' +
                                '        <div class="asset-detail">                                                 ' +
                                '            <p class="asset-name">                                                 ' +
                                '                ' + name + '                                                            ' +
                                '            </p>                                                                   ' +
                                '            <p class="asset-code">                                                 ' +
                                '                ' + symbol + '                                                                ' +
                                '            </p>                                                                   ' +
                                '            <p class="asset-balance">                                              ' +
                                '                <span class="bal">                                                 ' +
                                '                    <span class="curr-bal">' + contractaddress + '</span>                 ' +
                                '                </span>                                                            ' +
                                '            </p>                                                                   ' +
                                '        </div>                                                                     ' +
                                '    </div>                                                                         ' +
                                '</div>                                                                             '
                            );
                        }
                        else if (result.status === "error") {
                            showToast('Error', result.message);
                        }
                        hideSpinner(this_, '');
                    },
                    error: function () {

                    }
                });
            }, 500);
        }



    });

    function listContracts(this_, chain_network) {
        showSpinner(this_, '');

        delay(function () {
            $.ajax({
                type: "POST",
                data: {
                    chainnetwork: chain_network
                },
                url: "/listcontracts",
                success: function (result) {
                    if (result.status === "success") {
                        var contracts = result.contracts;
                        $('.contract-count span').text(contracts.length);
                        $('.contract .contract-item.ctnr').remove();
                        $.each(contracts, function (index, contract) {
                            var symbol = contract.symbol;
                            var name = contract.name;
                            var contractaddress = contract.contractAddress;

                            $('.contract').append(
                                '<div class="contract-item ctnr">                                                          ' +
                                '    <div class="contract-card">                                                      ' +
                                '        <div class="asset-detail">                                                 ' +
                                '            <p class="asset-name">                                                 ' +
                                '                ' + name + '                                                            ' +
                                '            </p>                                                                   ' +
                                '            <p class="asset-code">                                                 ' +
                                '                ' + symbol + '                                                                ' +
                                '            </p>                                                                   ' +
                                '            <p class="asset-balance">                                              ' +
                                '                <span class="bal">                                                 ' +
                                '                    <span class="curr-bal">' + contractaddress + '</span>                 ' +
                                '                </span>                                                            ' +
                                '            </p>                                                                   ' +
                                '        </div>                                                                     ' +
                                '    </div>                                                                         ' +
                                '</div>                                                                             '
                            );
                        });
                    }
                    else if (result.status === "error") {
                        showToast('Error', result.message);
                    }
                    hideSpinner(this_, '');
                },
                error: function () {

                }
            });
        }, 500);
    }

    $('#list-contract').click(function () {
        var this_ = $(this);
        showSpinner(this_, '');

        // true: mainnet
        // false: testnet
        var chain_network = $('#chain-network').prop('checked');
        hideSpinner(this_, '');
        listContracts(this_, chain_network);
    });

    var uri = "wss://" + window.location.host + "/ws";
    function connect() {
        console.log(uri);
        socket = new WebSocket(uri);
        socket.onopen = function (event) {
            console.log("opened connection to " + uri);
        };
        socket.onclose = function (event) {
            console.log("closed connection from " + uri);
        };
        socket.onmessage = function (event) {
            var data = JSON.parse(event.data);

            deposit(data);

        };
        socket.onerror = function (event) {
            console.log("error: " + event.data);
        };
    }
    $('#connect').click(function () {
        connect();
    });
    connect();

    function deposit(data) {
        var etherscanurl = "";
        var chain_network = $('#chain-network').prop('checked');
        if (chain_network) {
            etherscanurl = "https://etherscan.io/tx/";
        }
        else {
            etherscanurl = "https://ropsten.etherscan.io/tx/";
        }

        var asset_history = $('.asset-item[data-address="' + data.Result.Details[0].Address.toLowerCase() + '"]')
            .find('.asset-history');
        var tx_count = parseInt(asset_history.attr('data-tx-count'));

        if (tx_count === 0) {
            asset_history.find('.asset-transactions').empty();
        }

        var data_txhash = $('.asset-transaction[data-txhash="' + data.Result.TxId.toLowerCase() + '"]');
        if (data_txhash.length === 0) {
            asset_history.find('.asset-transactions').prepend('<p class="asset-transaction" data-txhash="' + data.Result.TxId.toLowerCase() + '">' +
                '<span class="tx-hash"><a href="' + etherscanurl + data.Result.TxId + '" target="_blank">' + data.Result.TxId + '</a></span>' +
                '<span class="confirmation">' +
                '<span>' + data.Result.Confirmations + '</span>' +
                '</span>' +
                '<span class="bal">' +
                '<span class="curr-bal">' + data.Result.Details[0].Amount + '</span>' +
                ' <span class="curr-type">' + data.Result.Asset.toUpperCase() + '</span>' +
                '</span>' +
                ' </p>');

            tx_count++;
            asset_history.attr('data-tx-count', tx_count);
        }
        else {
            data_txhash.eq(0).find('.confirmation span').text(data.Result.Confirmations);
        }

    }

});


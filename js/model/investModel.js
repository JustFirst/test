(function (global) {
    "use strict";
    var Backbone = global.Backbone,
        _ = global._,
        $ = global.$,
        InvestModel = Backbone.Model.extend({
            defaults: {
                sumInv: 10000,
                mult: 20,
                takeProfit: undefined,
                stopLoss: undefined,
                direction:"growth"
            },

            validate: function (attrs, options) {
                switch (options.target) {
                    case "sumInv":
                        if (attrs.sumInv < 100) {
                            return "Минимальная сумма инвестиции $ 100";
                        }
                        break;
                    case "mult":
                        if (attrs.mult < 1 || attrs.mult > 1) {
                            return "Неверное занчение мультипликатора";
                        }
                        break;
                    case "takeProfit":
                        if (options.inPersent && attrs.takeProfit) {
                            if (attrs.takeProfit < attrs.sumInv * 0.1) {
                                return "Не может быть меньше 10%";
                            }
                        }
                        if (options.inDollars && attrs.takeProfit) {
                            if (attrs.takeProfit < attrs.sumInv * 0.1) {
                                return "Не может быть меньше $" + attrs.sumInv * 0.1;
                            }
                        }
                        break;
                    case "stopLoss":
                        if (options.inPersent && attrs.stopLoss) {
                            if (attrs.stopLoss < attrs.sumInv * 0.1) {
                                return "Не может быть меньше 10%";
                            }
                            if (attrs.stopLoss > this.sumInv) {
                                return "Не может быть больше 100%";
                            }
                        }
                        if (options.inDollars && attrs.stopLoss) {
                            if (attrs.stopLoss < attrs.sumInv * 0.1) {
                                return "Не может быть меньше $" + attrs.sumInv * 0.1;
                            }
                            if (attrs.stopLoss > this.sumInv) {
                                return "Не может быть больше $" + attrs.sumInv;
                            }
                        }
                        break;
                    default:
                        break;
                }
            },

            sendData: function () {
                var data = this.toJSON();
                var undefIndexes = [];
                for (var i = 0; i < Object.keys(data).length; i++) {
                    if (data[Object.keys(data)[i]] === undefined) {
                        undefIndexes.push(i);
                    }
                }
                while (undefIndexes.length !== 0) {
                    delete data[Object.keys(data)[undefIndexes[undefIndexes.length - 1]]];
                    undefIndexes.pop();
                }
                console.log(data);
                var request = $.ajax({
                    url: "index.php",
                    method: "POST",
                    data: data
                }).done(function (data) {
                    console.log(data);
                }).fail(function(data, status, error) {
                    console.log("упал, да и хуй с ним");
                    console.log(status);
                });
            }
        });
        window.investModel = new InvestModel();
})(window);

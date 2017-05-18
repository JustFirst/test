(function (global) {
    "use strict";
    var Backbone = global.Backbone,
        _ = global._,
        $ = global.$,
        InvestModel = Backbone.Model.extend({
            defaults: {
                sumInv: 5000,
                mult: 40,
                factInv: 200000,
                takeProfit: undefined,
                stopLoss: undefined,
                direction:"growth"
            },

            initialize: function () {
                this.on("change:sumInv change:mult", this.countFactInv, this);
            },

            validate: function (attrs, options) {
                switch (options.target) {
                    case "sumInv":
                        if (attrs.sumInv < 100) {
                            return "Минимальная сумма инвестиции $ 100";
                        }
                        this.trigger("valid", options);
                        break;
                    case "mult":
                        if (attrs.mult < 1 || attrs.mult > 40) {
                            return "Неверное занчение мультипликатора";
                        }
                        this.trigger("valid", options);
                        break;
                    case "takeProfit":
                        if (options.inPersent && attrs.takeProfit !== void(0)) {
                            if (attrs.takeProfit < attrs.sumInv * 0.1) {
                                return "Не может быть меньше 10%";
                            }
                        }
                        if (options.inDollars && attrs.takeProfit !== void(0)) {
                            if (attrs.takeProfit < attrs.sumInv * 0.1) {
                                return "Не может быть меньше $" + attrs.sumInv * 0.1;
                            }
                        }
                        this.trigger("valid", options);
                        break;
                    case "stopLoss":
                        if (options.inPersent && attrs.stopLoss !== void(0)) {
                            if (attrs.stopLoss < attrs.sumInv * 0.1) {
                                return "Не может быть меньше 10%";
                            }
                            if (attrs.stopLoss > this.sumInv) {
                                return "Не может быть больше 100%";
                            }
                        }
                        if (options.inDollars && attrs.stopLoss !== void(0)) {
                            if (attrs.stopLoss < attrs.sumInv * 0.1) {
                                return "Не может быть меньше $" + attrs.sumInv * 0.1;
                            }
                            if (attrs.stopLoss > this.sumInv) {
                                return "Не может быть больше $" + attrs.sumInv;
                            }
                        }
                        this.trigger("valid", options);
                        break;
                    default:
                        this.trigger("valid", options);
                        break;
                }
            },

            countFactInv: function () {
                this.set("factInv", this.get("mult") * this.get("sumInv"));
                console.log(this.get("mult"), this.get("sumInv"));
            },

            countLimits: function (val, options) {
                if (val && options.target === "takeProfit") {
                    this.set("takeProfit", this.get("sumInv") * val / 100, options);
                }
                else {
                    if (val && options.target === "stopLoss") {
                        this.set("stopLoss", this.get("sumInv") * val / 100, options);
                    }
                }
            },

            sendData: function () {
                var data = this.toJSON();
                var undefIndexes = [];
                for (var i = 0; i < Object.keys(data).length; i++) {
                    if (!data[Object.keys(data)[i]] || Object.keys(data)[i]==="factInv") {
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
                    alert(data);
                }).fail(function(data, status, error) {
                    alert(status);
                });
            }
        });
        window.investModel = new InvestModel();
})(window);

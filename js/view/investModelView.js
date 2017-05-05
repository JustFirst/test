(function (global) {
    "use strict";
    var Backbone = global.Backbone,
        _ = global._,
        $ = global.$,
        InvestModelView = Backbone.View.extend({
            model: global.investModel,

            el: $("form.invest-form"),

            template: _.template($("#form-template").html(), {variable: "formValues"}),

            events: {
                "change input.invest-form-text": "updateAttr",
                "click input.limits-type-radio": "setLimitTypeOption",
                "click input.limits-values-checkbox": "enableLimits",
                "click input.btn": function(event) {
                    if (event.target.name === "in-growth") {
                        this.model.set("direction", "growth");
                    }
                    if (event.target.name === "in-reduction") {
                        this.model.set("direction", "reduction");
                    }
                    this.model.sendData();
                }
            },

            options: {
                validate: true,

                inPersent: false,

                inDollars: true,

                target: undefined
            },

            initialize: function () {
                this.listenTo(this.model, "invalid", this.raiseError);
                this.render();
            },

            render: function () {
                this.$el.html(this.template(this.model.toJSON(), {variable: "formValues"}));
            },

            raiseError: function (model, error, options) {
                console.log(error);
            },

            updateAttr: function (event) {
                this.options.target = event.target.name;
                this.model.set(event.target.name, event.target.value, this.options);
            },

            setLimitTypeOption: function () {
                var checkedRadio = $("input.limits-type-radio:checked");
                if (checkedRadio.val() === "$") {
                    this.options.inDollars = true;
                    this.options.inPersent = false;
                }
                if (checkedRadio.val() === "%") {
                    this.options.inPersent = true;
                    this.options.inDollars = false;
                }
            },

            enableLimits: function (event) {
                var checkBox = event.target;
                var limitsTextboxes = $(".limits-values").find(".invest-form-text");
                for (var i = 0; i < limitsTextboxes.length; i++) {
                    if ($(limitsTextboxes[i]).prop("name") === event.target.name) {
                        if (checkBox.checked) {
                            $(limitsTextboxes[i]).prop("disabled", false);
                        }
                        else {
                            $(limitsTextboxes[i]).prop("disabled", true);
                        }
                    }
                }
            }

        });
        new InvestModelView();
})(window);

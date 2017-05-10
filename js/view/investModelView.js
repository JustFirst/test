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
                },
                "mousedown .slider-roller": "slide",
                "mouseup": function () {
                    if (this.slideActive === true) {
                        $(document).off("mousemove");
                        var slider = this.slider();
                        var percent = slider.width()/100;
                        var rollerPos = slider.find(".slider-roller").css("left").substring(0, $(event.target).css("left").indexOf("px"));
                        this.model.set("mult", $("input[name=mult]").val());
                        this.slideActive = false;
                    }
                }
            },

            slideActive: false,

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
            },


            slider: function () {
                return this.$el.find(".slider-controller");
            },

            slide: function (event) {
                event.preventDefault();
                this.slideActive = true;
                var slider = this.slider();
                var percent = slider.width()/ 100;
                var initCursorPos = event.pageX;
                var initRollerPos = Number($(event.target).css("left").substring(0, $(event.target).css("left").indexOf("px")));
                var currentCursorPos = 0;
                $(document).mousemove(function (e) {
                    var rollerPos = Number($(event.target).css("left").substring(0, $(event.target).css("left").indexOf("px")));
                    currentCursorPos = e.pageX;
                    if (rollerPos <= slider.width() && rollerPos >= 0) {
                        if ((initRollerPos+currentCursorPos-initCursorPos)/percent < 100 && (initRollerPos+currentCursorPos-initCursorPos)/percent > 0) {
                            $(event.target).css("left", (initRollerPos+currentCursorPos-initCursorPos)/percent+"%");
                        }
                        else {
                            if ((rollerPos - 100) < 0) {
                                $(event.target).css("left", "0%");
                            }
                            else {
                                $(event.target).css("left", "100%");
                            }
                        }
                        this.$el.find("input[name=mult]").val(Math.round(Number($(event.target).css("left").substring(0, $(event.target).css("left").indexOf("px"))/percent * 0.4)));
                    }
                }.bind(this));
            }
        });
        new InvestModelView();
})(window);

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
                "click label.radio-apearence": function (e) {
                    this.toggleLimitTypeRadio(e.target);
                },
                "click input.limits-values-checkbox": "enableLimits",
                "click label.checkApearence": function (e) {
                    this.toggleLimitsCheckbox(e.target);
                },
                "click .open-limits": "showLimits",
                "click #mult": "toggleSliderVisible",
                "mousedown .slider-roller": "slide",
                "click": function (e) {
                    if (this.sliderContainer().hasClass("active") && !this.sliderContainer().is(e.target) && this.sliderContainer().has(e.target).length === 0 && !$("input#mult").is(e.target)) {
                        this.hideSlider();
                        e.preventDefault();
                    }
                },
                "mouseup": function () {
                    if (this.slideActive === true) {
                        $(document).off("mousemove");
                        var slider = this.sliderContainer().find(".slider-controller");
                        var percent = slider.width()/100;
                        var rollerPos = slider.find(".slider-roller").css("left").substring(0, $(event.target).css("left").indexOf("px"));
                        this.model.set("mult", $("input[name=mult]").val());
                        this.slideActive = false;
                    }
                },
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
                var apearenceLabel = $("label[for='"+ checkedRadio.attr("id") +"'].radio-apearence");
                this.toggleLimitTypeRadio(apearenceLabel);
                if (checkedRadio.val() === "$") {
                    this.options.inDollars = true;
                    this.options.inPersent = false;
                }
                if (checkedRadio.val() === "%") {
                    this.options.inPersent = true;
                    this.options.inDollars = false;
                }
            },

            toggleLimitTypeRadio: function (elem) {
                var radioGroup = [];
                $("input[type='radio'][name='limitsType']").each(function () {
                    radioGroup.push($("label[for='"+ $(this).attr("id") +"'].radio-apearence"));
                });
                if ($(elem).hasClass("radio-checked")) {
                    return;
                }
                else {
                    $(elem).addClass("radio-checked");
                    for (var i = 0; i < radioGroup.length; i++) {
                        if (!radioGroup[i].is(elem) && radioGroup[i].hasClass("radio-checked")) {
                            radioGroup[i].removeClass("radio-checked");
                        }
                    }
                }
            },

            enableLimits: function (event) {
                var checkBox = event.target;
                var apearenceLabel = $("label[for='"+ checkBox.id +"'].checkApearence");
                this.toggleLimitsCheckbox(apearenceLabel);
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

            toggleLimitsCheckbox: function (elem) {
                $(elem).toggleClass("box-checked");
            },

            sliderContainer: function () {
                return this.$el.find(".slider");
            },

            toggleSliderVisible: function (e) {
                var sliderContainer = this.sliderContainer();
                if (!sliderContainer.hasClass("active")) {
                    sliderContainer.addClass("active");
                    sliderContainer.css("display", "block");
                }
                else {
                    this.hideSlider();
                }
            },

            hideSlider: function () {
                var sliderContainer = this.sliderContainer();
                sliderContainer.removeClass("active");
                sliderContainer.css("display", "none");
            },

            slide: function (event) {
                event.preventDefault();
                this.slideActive = true;
                var slider = this.sliderContainer().find(".slider-controller");
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
            },

            showLimits: function (e) {
                if ($(e.target).hasClass("active")) {
                    this.$el.find("div.limits-set").css("display", "none");
                    $(e.target).removeClass("active");
                }
                else {
                    $(e.target).addClass("active");
                    this.$el.find("div.limits-set").css("display", "block");
                }
            }
        });
        new InvestModelView();
})(window);

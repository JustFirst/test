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
                "change input#mult,input#sumInv": "multValueCount",
                "change input#mult": "countRollerPos",
                "input input.invest-form-text": "inputFormat",
                "click input.limits-type-radio": "setLimitTypeOption",
                "click input.limits-values-checkbox": "enableLimits",
                "click div.open-limits": "showLimits",
                "click span.numeric-updown": "updateVal",
                "click .numeric-down": "reduceVal",
                "click #mult": "toggleSliderVisible",
                "click .slider-controller": "cangeRollerPosition",
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
                        this.model.set("mult", Number($("input#mult").val()));
                        this.slideActive = false;
                    }
                },
                "click .btn": function(event) {
                    if (this.$el.find(".error").hasClass("active")) {
                        return;
                    }
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

                defaultVal: false,

                target: undefined,

                errorsQueue: []
            },

            initialize: function () {
                this.listenTo(this.model, "invalid", this.raiseError);
                this.listenTo(this.model, "valid", this.hideError);
                this.listenTo(this.model, "change:factInv", this.updateFactInv);
                this.render();
            },

            render: function () {
                var attrs = this.model.toJSON();
                for (var i = 0; i < Object.keys(attrs).length; i++) {
                    if (typeof attrs[Object.keys(attrs)[i]] === "number") {
                        attrs[Object.keys(attrs)[i]] = this.inputFormat(attrs[Object.keys(attrs)[i]]);
                    }
                }
                this.$el.html(this.template(attrs, {variable: "formValues"}));
            },

            updateFactInv: function () {
                var factInv = this.model.get("factInv");
                console.log(factInv);
                factInv = this.inputFormat(factInv);
                $("#fact-inv").html(factInv);
            },

            raiseError: function (model, errorText, options) {
                var target = this.$el.find("input#"+ options.target +"").parent();
                var error = target.find(".error");
                var checkActiveErrors = false;
                var i;
                target.addClass("active");
                this.$el.find(".error").each(function () {
                    if ($(this).hasClass("active")) {
                        checkActiveErrors = true;
                    }
                });
                if (checkActiveErrors) {
                    for (i = 0; i < options.errorsQueue.length; i++) {
                        if (options.errorsQueue[i].errorText === errorText) {
                            return;
                        }
                    }
                    options.errorsQueue.push({errorText: errorText, errorTarget: options.target});
                    return;
                }
                error.addClass("active");
                error.find(".error-text").html(errorText);
                for (i = 0; i < options.errorsQueue.length; i++) {
                    if (options.errorsQueue[i].errorText === errorText) {
                        options.errorsQueue.splice(i, 1);
                    }
                }
            },

            hideError: function (options) {
                var target = this.$el.find("input#"+ options.target +"").parent();
                var error = target.find(".error");
                if (error.hasClass("active")) {
                    target.removeClass("active");
                    error.removeClass("active");
                }
                if (this.options.errorsQueue.length) {
                    options.target = this.options.errorsQueue[0].errorTarget;
                    this.raiseError(this.model, options.errorsQueue[0].errorText, this.options);
                }
            },

            inputFormat: function (e) {
                var input,
                    inputVal;
                input = e.target || null;
                if (input) {
                    inputVal = parseInt($(input).val().replace(/\D/g, ""), 10);
                    if (!isNaN(inputVal)) {
                        if (input.id === "sumInv") {
                            if (inputVal <= 200000) {
                                $(input).val(inputVal.toLocaleString());
                            }
                            else {
                                $(input).val((200000).toLocaleString());
                            }
                        }
                        else {
                            if (input.id === "mult") {
                                if (inputVal <= 99) {
                                    $(input).val(inputVal.toLocaleString());
                                }
                                else {
                                    $(input).val((99).toLocaleString());
                                }
                            }
                            else {
                                $(input).val(inputVal.toLocaleString());
                            }
                        }
                    }
                    else {
                        $(input).val(0);
                    }
                }
                else {
                    inputVal = parseInt(e.toString().replace(/\D/g, ""), 10);
                    return inputVal.toLocaleString();
                }
            },

            updateAttr: function (event) {
                this.options.target = event.target.id;
                if ((this.options.target === "takeProfit" || this.options.target === "stopLoss") && this.options.inPersent) {
                    this.model.countLimits(parseInt(event.target.value.replace(/\D/g, ""), 10), this.options);
                    return;
                }
                this.model.set(event.target.id, event.target.value === "" ?  void(0) : parseInt(event.target.value.replace(/\D/g, ""), 10), this.options);
            },

            sliderContainer: function () {
                return this.$el.find(".slider");
            },

            toggleSliderVisible: function (e) {
                var sliderContainer = this.sliderContainer();
                var slider = sliderContainer.find(".slider-controller");
                var sliderRoller = sliderContainer.find(".slider-roller");
                var mult = parseInt(this.$el.find("#mult").val(), 10);
                var percent;
                if (!sliderContainer.hasClass("active")) {
                    sliderContainer.addClass("active");
                    percent = slider.width()/ 100;
                    sliderRoller.css("left", mult / 0.4 * percent);
                    slider.find(".slider-range").css("width", mult / 0.4 * percent);
                }
                else {
                    this.hideSlider();
                }
            },

            hideSlider: function () {
                var sliderContainer = this.sliderContainer();
                sliderContainer.removeClass("active");
            },

            countRollerPos: function () {
                var sliderContainer = this.sliderContainer();
                if (!sliderContainer.hasClass("active")) {
                    return;
                }
                var slider = sliderContainer.find(".slider-controller");
                var sliderRoller = sliderContainer.find(".slider-roller");
                var mult = parseInt(this.$el.find("#mult").val(), 10);
                if (mult >= 1 && mult <= 40) {
                    var percent = slider.width()/ 100;
                    sliderRoller.css("left", mult / 0.4 * percent);
                    slider.find(".slider-range").css("width", mult / 0.4 * percent);
                }
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
                        slider.find(".slider-range").css("width", $(event.target).css("left"));
                        this.$el.find("input#mult").val(Math.round(Number($(event.target).css("left").substring(0, $(event.target).css("left").indexOf("px"))/percent * 0.4)));
                        this.$el.find("input#mult").trigger("change");
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
            },

            setLimitTypeOption: function (e) {
                var checkedRadio = $("input.limits-type-radio:checked");
                var apearenceLabel = $("label[for='"+ checkedRadio.attr("id") +"'].radio-apearence");
                var inv, limit, model = this.model;
                this.toggleLimitTypeRadio(apearenceLabel);
                if (checkedRadio.val() === "$") {
                    this.options.inDollars = true;
                    this.options.inPersent = false;
                    $(".text-wrapper.limit-text-wrapper").removeClass("percent-before");
                    $(".text-wrapper.limit-text-wrapper").find("input.invest-form-text").each(function () {
                        if(!$(this).prop("disabled")) {
                            inv = model.get("sumInv");
                            limit = model.get(this.id);
                            this.value = limit;
                            $(this).trigger("input");
                        }
                    });

                }
                if (checkedRadio.val() === "%") {
                    this.options.inPersent = true;
                    this.options.inDollars = false;
                    $(".text-wrapper.limit-text-wrapper").addClass("percent-before");
                    $(".text-wrapper.limit-text-wrapper").find("input.invest-form-text").each(function () {
                        if(!$(this).prop("disabled")) {
                            inv = model.get("sumInv");
                            limit = model.get(this.id);
                            this.value = Math.round(limit / inv * 100);
                            $(this).trigger("input");
                        }
                    });
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
                var apearenceLabel = $("label[for='"+ checkBox.id +"'].check-apearence");
                var limitsTextboxes = $(".limits-values").find(".invest-form-text");
                this.toggleLimitsCheckbox(apearenceLabel);
                for (var i = 0; i < limitsTextboxes.length; i++) {
                    if ($(limitsTextboxes[i]).prop("id") === $(event.target).attr("target")) {
                        if (checkBox.checked) {
                            $(limitsTextboxes[i]).prop("disabled", false);
                            limitsTextboxes[i].value = 30;
                            this.options.defaultVal = true;
                            if (this.options.inDollars) {
                                this.options.target = $(limitsTextboxes[i]).prop("id");
                                this.model.countLimits(limitsTextboxes[i].value, this.options);
                                $(limitsTextboxes[i]).val(this.model.get($(limitsTextboxes[i]).prop("id")));
                                $(limitsTextboxes[i]).trigger("input");
                            }
                            else {
                                this.options.target = $(limitsTextboxes[i]).prop("id");
                                this.model.countLimits(limitsTextboxes[i].value, this.options);
                                $(limitsTextboxes[i]).trigger("input");
                            }
                            $(limitsTextboxes[i]).parents().each(function () {
                                if ($(this).hasClass("text-wrapper")) {
                                    $(this).removeClass("disabled");
                                }
                                if ($(this).children(".disabler") && $(this).children(".disabler").attr("target") === $(limitsTextboxes[i]).prop("id")) {
                                    $(this).children(".disabler").removeClass("active");
                                }
                            });
                        }
                        else {
                            $(limitsTextboxes[i]).prop("disabled", true);
                            $(limitsTextboxes[i]).val(void(0));
                            $(limitsTextboxes[i]).trigger("change");
                            $(limitsTextboxes[i]).parents().each(function () {
                                if ($(this).hasClass("text-wrapper")) {
                                    $(this).addClass("disabled");
                                }
                                if ($(this).children(".disabler") && $(this).children(".disabler").attr("target") === $(limitsTextboxes[i]).prop("id")) {
                                    $(this).children(".disabler").addClass("active");
                                }
                            });
                        }
                    }
                }
            },

            toggleLimitsCheckbox: function (elem) {
                $(elem).toggleClass("box-checked");
            },

            updateVal: function (e) {
                var parents = $(e.target).parents();
                var input;
                for (var i = 0; i < parents.length; i++) {
                    if ($(parents[i]).children(".limit-text")) {
                        input = $(parents[i]).children(".limit-text");
                        break;
                    }
                }
                if ($(e.target).hasClass("numeric-up")) {
                    input.val(parseInt(input.val().replace(/\D/g, ""), 10) + 1);
                }
                else {
                    input.val(parseInt(input.val().replace(/\D/g, ""), 10) - 1);
                }
                input.trigger("input");
                input.trigger("change");
            }
        });
        new InvestModelView();
})(window);

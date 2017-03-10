/**
 * Created by lijianlin on 17/3/10.
 */
//
// var Parameter = schema({
//     "name"      :   String,
//     "type"      :   ["int","bool","real","var"],
//     "abstract"  :   String
// });
//
// var Formula = schema({
//     "name"        :   String,
//     "description" :   String,   // MarkDown and LaTex Support
//     "abstract"    :   String,   // a short version, used as subtitle of formulae
//     "expression"  :   String,
//     "parameters"  :   Array.of(Parameter)
// });
//
// var Package = schema({
//     "name"      :   String,
//     "formulas"  :   Array.of(Formula)
// });
//
// var PackList = schema(Array.of(Package))

var ParameterTypes = ["int","bool","real","var"]
var pack_list = [{
    name      : "Liveness Property",
    formulas  : [{
        name          :    "simple liveness",
        description   :    "a simple liveness property",
        abstract      :    "something good will happend",
        expression    :    "F {t1}={t2}",
        parameters    : [{
            name     :    "t1",
            type     :    "var",
            abstract :    "an varible in model"
        },{
            name     :    "t2",
            type     :    "int",
            abstract :    "an constant integer"
        }]
    }]
},{
    name      : "Fairness Property",
    formulas  : [{
        name          :    "Uncoditional Fairness",
        description   :    "a simple Fairness property",
        abstract      :    "{t1}={t2} happen infinitely many times",
        expression    :    "GF {t1}={t2}",
        parameters    : [{
            name     :    "t1",
            type     :    "var",
            abstract :    "an varible in model"
        },{
            name     :    "t2",
            type     :    "int",
            abstract :    "an constant integer"
        }]
    },{
        name          :    "Strong Fairness",
        description   :    "a not so simple Fairness property",
        abstract      :    "if {t1}={t2} infinitely often then {t3}={t4} also will",
        expression    :    "GF {t1}={t2} -> GF {t3}={t4}",
        parameters    : [{
            name     :    "t1",
            type     :    "var",
            abstract :    "an varible in model"
        },{
            name     :    "t2",
            type     :    "int",
            abstract :    "an constant integer"
        },{
            name     :    "t3",
            type     :    "var",
            abstract :    "an varible in model"
        },{
            name     :    "t4",
            type     :    "int",
            abstract :    "an constant integer"
        }]
    },{
        name          :    "Weak Fairness",
        description   :    "a not so simple Fairness property",
        abstract      :    "if {t1}={t2} finally forever then {t3}={t4} also will",
        expression    :    "FG {t1}={t2} -> GF {t3}={t4}",
        parameters    : [{
            name     :    "t1",
            type     :    "var",
            abstract :    "an varible in model"
        },{
            name     :    "t2",
            type     :    "int",
            abstract :    "an constant integer"
        },{
            name     :    "t3",
            type     :    "var",
            abstract :    "an varible in model"
        },{
            name     :    "t4",
            type     :    "int",
            abstract :    "an constant integer"
        }]
    }] //formulas
},{
    name      : "Safety Property",
    formulas  : [{
        name          :    "Invariant",
        description   :    "a simple safety property",
        abstract      :    "{t1}={t2} holds in every state",
        expression    :    "G {t1}={t2}",
        parameters    : [{
            name     :    "t1",
            type     :    "var",
            abstract :    "an varible in model"
        },{
            name     :    "t2",
            type     :    "int",
            abstract :    "an constant integer"
        }]
    }]
}];
window.util.pack_idx = 0;
window.util.formula_idx = 0;
window.util.refresh_property_templates = function() {
    var lstPackage = $("#lstPackage");
    lstPackage.empty();
    pack_list.forEach(function(value,index){
        var item = $("<a class='list-group-item'></a>").text(value["name"]);
        item.click(function(){
            util.pack_idx = index;
            util.refresh_property_templates();
        });
        if(index === util.pack_idx) {
            item.addClass("active");
        }
        lstPackage.append(item);
    });

    var lstFormula =$("#lstFormula");
    lstFormula.empty();
    var formulas = pack_list[util.pack_idx]["formulas"];
    formulas.forEach(function(value,index){
        var item = $("<a class='list-group-item'></a>").text(value["name"]);
        if(index === util.formula_idx) {
            item.addClass("active");
        }
        item.click(function(){
            util.formula_idx = index;
            util.refresh_property_templates();
        });
        lstFormula.append(item);
    });

    var formula = formulas[util.formula_idx];
    var divFormulaDesc = $("#divFormulaDesc");
    divFormulaDesc.empty();
    ["description","abstract","expression"].forEach(function(key){
        divFormulaDesc.append($("<p></p>").text(formula[key]));
    });

    $('#parameter-list tbody').empty();
    formula["parameters"].forEach(function(param,index){
        util.add_parameter(param["name"],param["type"],index);
    })

}


window.util.add_parameter = function (name,type,index) {
    var row = $(window.util.create_constant_line(name, type,"",ParameterTypes));
    row.attr("id","parameter-item-" + index);
    $('#parameter-list tbody').append(row);
}


window.util.create_formula_with_parameters = function(){
    var formula = pack_list[util.pack_idx]["formulas"][util.formula_idx];
    var exp = formula["expression"];
    formula["parameters"].forEach(function (param,index) {
        param["value"] = $("#parameter-item-" + index + " input:last").val();
        if(param["type"] === "var") {
            var reg = new RegExp("(\\W|^)({" + param["name"] + "})(\\W|$)", "g");
            reg.multiline = true;
            exp = exp.replace(reg, "$1" + param["value"] + "$3");
        }
        else {
            util.add_constant(param);
            //TODO rename paramter with formula name as prefix
        }
    });

    // console.log(exp);

    var prop = {
        formula: exp,
        comments: "create from template"
    };

    util.add_property(prop);
    util.navi_to("main-interface");
}
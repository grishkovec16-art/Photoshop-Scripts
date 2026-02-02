#target photoshop

function showConstructor() {
    var presets = [
        {id: "vignette_8", name: "8 Учеников", file: "vignette_8.jpg"},
        {id: "vignette_24_teach_center", name: "24 Уч. + Учитель", file: "vignette_24_teach_center.jpg"},
        {id: "vignette_30_classic", name: "30 Учеников (5х6)", file: "vignette_30_classic.jpg"}
    ];

    // Окно диалога
    var win = new Window("dialog", "Конструктор Виньеток PRO");
    win.orientation = "column";
    win.alignChildren = ["fill", "top"];
    win.spacing = 10;
    win.margins = 16;

    win.add("statictext", undefined, "ВЫБОР ШАБЛОНА:").graphics.font = ScriptUI.newFont("Tahoma", "BOLD", 14);

    // Группа выбора
    var mainGrp = win.add("group");
    mainGrp.orientation = "row";
    
    var list = mainGrp.add("dropdownlist", [0, 0, 200, 30]);
    for (var i = 0; i < presets.length; i++) list.add("item", presets[i].name);
    list.selection = 0;

    // Превью
    var imgPnl = mainGrp.add("panel", undefined, "Превью");
    var preview = imgPnl.add("image", [0, 0, 250, 180]);

    // Функция обновления превью
    function updateImg() {
        var path = Folder.userData + "/Adobe/CEP/extensions/com.vignette.cloud/assets/previews/" + presets[list.selection.index].file;
        var f = new File(path);
        if (f.exists) preview.image = f;
    }

    list.onChange = updateImg;
    updateImg();

    // Чекбокс учителя
    var checkTeacher = win.add("checkbox", undefined, "Добавить учителя в центр");
    checkTeacher.value = true;

    // Кнопки
    var btnGrp = win.add("group");
    btnGrp.alignment = "right";
    var btnCancel = btnGrp.add("button", undefined, "ОТМЕНА", {name: "cancel"});
    var btnOk = btnGrp.add("button", undefined, "СОЗДАТЬ", {name: "ok"});

    if (win.show() == 1) {
        // Здесь запускается ваша логика отрисовки слоев
        alert("Запуск генерации макета: " + presets[list.selection.index].id);
        // Вызов функции отрисовки...
    }
}

showConstructor();

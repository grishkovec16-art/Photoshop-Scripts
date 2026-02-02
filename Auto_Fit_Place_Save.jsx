#target photoshop

/**
 * Функция получения ключа из памяти Photoshop, 
 * который туда записывает ваша панель (index.html)
 */
function getStoredLicenseKey() {
    try {
        var ref = new ActionReference();
        ref.putProperty(charIDToTypeID('Prpt'), stringIDToTypeID('vignette_license_key'));
        ref.putEnumerated(charIDToTypeID('capp'), charIDToTypeID('Ordn'), charIDToTypeID('Trgt'));
        var result = executeActionGet(ref);
        return result.getString(stringIDToTypeID('vignette_license_key'));
    } catch (e) { 
        return null; 
    }
}

function main() {
    // --- ПРОВЕРКА ЗАЩИТЫ ---
    var key = getStoredLicenseKey();
    if (!key) {
        alert("ОШИБКА: Плагин не активирован! Пожалуйста, введите ключ в панели.");
        return;
    }

    if (app.documents.length === 0) { 
        alert("Ошибка: Откройте шаблон ОБЛОЖКИ!"); 
        return; 
    }
    
    var doc = app.activeDocument;
    var rootFolder = Folder.selectDialog("Выберите папку с папками учеников");
    if (!rootFolder) return;

    // --- ДИАЛОГ ВЫБОРА ТИПОГРАФИИ ---
    var printChoice = "Other";
    var win = new Window("dialog", "Настройка экспорта ОБЛОЖЕК");
    win.orientation = "column"; 
    win.alignChildren = ["fill", "top"]; 
    win.spacing = 15; 
    win.margins = 20;

    var txt = win.add("statictext", undefined, "Выберите формат именования:");
    txt.graphics.font = ScriptUI.newFont("Tahoma", "Bold", 12);

    var rbOther = win.add("radiobutton", undefined, "Обычный (Фамилия Имя.jpg)");
    var rbPhotofier = win.add("radiobutton", undefined, "Фотофиера (00-XXX.jpg)");
    rbOther.value = true;

    var btnGroup = win.add("group");
    btnGroup.alignment = "center";
    btnGroup.add("button", undefined, "ОК", {name: "ok"});
    btnGroup.add("button", undefined, "Отмена", {name: "cancel"});

    if (win.show() != 1) return;
    printChoice = rbOther.value ? "Other" : "Photofier";

    // --- ОБРАБОТКА ---
    var outputFolder = new Folder(rootFolder.parent + "/Covers_Result");
    if (!outputFolder.exists) outputFolder.create();

    var childFolders = rootFolder.getFiles(function(f) {
        return (f instanceof Folder) && (f.name.indexOf("Result") === -1) && (f.name.indexOf("Output") === -1);
    });

    for (var i = 0; i < childFolders.length; i++) {
        var studentFolder = childFolders[i];
        var photos = studentFolder.getFiles(/\.(jpg|jpeg|png|tif)$/i);
        
        if (photos.length === 0) continue;

        var addedLayer = null;
        try {
            // Вставляем фото в слой "Основа_1"
            addedLayer = insertAndFit(doc, "Основа_1", photos[0]);

            // Формируем имя файла
            var fileName;
            if (printChoice === "Photofier") {
                var index = i + 1;
                var padIndex = ("000" + index).slice(-3);
                fileName = "00-" + padIndex;
            } else {
                fileName = studentFolder.name;
            }

            // Сохранение
            saveFiles(doc, outputFolder, fileName);

            // Удаляем вставленный слой перед следующим учеником
            if (addedLayer) addedLayer.remove();

        } catch (e) {
            alert("Ошибка в папке " + studentFolder.name + ": " + e);
        }
    }

    alert("Все обложки готовы!\nСохранено в: " + outputFolder.fsName);
    outputFolder.execute();
}

function insertAndFit(doc, baseName, photoPath) {
    var baseLayer = doc.layers.getByName(baseName);
    doc.activeLayer = baseLayer;
    
    var desc = new ActionDescriptor();
    desc.putPath(charIDToTypeID("null"), new File(photoPath));
    executeAction(charIDToTypeID("Plc "), desc, DialogModes.NO);
    
    var photoLayer = doc.activeLayer;
    
    // Кадрирование (Fill)
    var pB = photoLayer.bounds; 
    var bB = baseLayer.bounds;
    
    var pW = pB[2] - pB[0]; 
    var pH = pB[3] - pB[1];
    var bW = bB[2] - bB[0]; 
    var bH = bB[3] - bB[1];
    
    var ratio = Math.max(bW / pW, bH / pH) * 100;
    photoLayer.resize(ratio, ratio, AnchorPosition.MIDDLECENTER);
    
    var pNewB = photoLayer.bounds;
    var pCenter = [pNewB[0] + (pNewB[2]-pNewB[0])/2, pNewB[1] + (pNewB[3]-pNewB[1])/2];
    var bCenter = [bB[0] + bW/2, bB[1] + bH/2];
    
    photoLayer.translate(bCenter[0] - pCenter[0], bCenter[1] - pCenter[1]);

    // Создаем обтравочную маску
    executeAction(stringIDToTypeID("groupEvent"), undefined, DialogModes.NO);
    
    return photoLayer;
}

function saveFiles(doc, folder, name) {
    var jpgFile = new File(folder + "/" + name + ".jpg");
    var jpgOpt = new JPEGSaveOptions();
    jpgOpt.formatOptions = FormatOptions.OPTIMIZEDBASELINE;
    jpgOpt.quality = 12;
    doc.saveAs(jpgFile, jpgOpt, true, Extension.LOWERCASE);
}

main();

#target photoshop

/**
 * Ультра-надежный поиск ключа
 */
function getStoredLicenseKey() {
    // 1. Проверка в глобальной переменной приложения
    if (typeof app.vignetteKey !== 'undefined' && app.vignetteKey !== null) {
        return app.vignetteKey;
    }
    // 2. Проверка в ActionDescriptor (реестр Photoshop)
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
    // --- БЛОК ПРОВЕРКИ АКТИВАЦИИ ---
    var key = getStoredLicenseKey();
    if (!key) {
        alert("ОШИБКА: Плагин не активирован! Пожалуйста, введите ключ в панели.");
        return;
    }
    // ------------------------------

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
    win.orientation = "column"; win.alignChildren = ["fill", "top"]; win.spacing = 15; win.margins = 20;

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
    // ---------------------------------

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
            // Вставка фото в Основу_1
            addedLayer = insertAndFit(doc, "Основа_1", photos[0]);

            // Формирование имени файла по спецификации
            var fileName = "";
            if (printChoice === "Photofier") {
                var bookNum = (i + 1).toString();
                while (bookNum.length < 3) bookNum = "0" + bookNum; 
                fileName = "00-" + bookNum; 
            } else {
                fileName = studentFolder.name;
            }

            saveFiles(doc, outputFolder, fileName);

            // Очистка шаблона для следующего ученика
            if (addedLayer) addedLayer.remove();
            if (i % 5 === 0) app.purge(PurgeTarget.ALLCACHES);

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
    var pB = photoLayer.bounds; var bB = baseLayer.bounds;
    var pW = pB[2] - pB[0]; var pH = pB[3] - pB[1];
    var bW = bB[2] - bB[0]; var bH = bB[3] - bB[1];
    var ratio = Math.max(bW / pW, bH / pH) * 100;
    photoLayer.resize(ratio, ratio, AnchorPosition.MIDDLECENTER);
    
    var pNewB = photoLayer.bounds;
    var pCenter = [pNewB[0] + (pNewB[2]-pNewB[0])/2, pNewB[1] + (pNewB[3]-pNewB[1])/2];
    var bCenter = [bB[0] + bW/2, bB[1] + bH/2];
    photoLayer.translate(bCenter[0] - pCenter[0], bCenter[1] - pCenter[1]);

    // Создание обтравочной маски (Clipping Mask)
    executeAction(stringIDToTypeID("groupEvent"), undefined, DialogModes.NO);
    return photoLayer;
}

function saveFiles(doc, folder, name) {
    var jpgFile = new File(folder + "/" + name + ".jpg");
    var psdFile = new File(folder + "/" + name + ".psd");
    var jpgOpt = new JPEGSaveOptions();
    jpgOpt.quality = 12;
    doc.saveAs(jpgFile, jpgOpt, true, Extension.LOWERCASE);
    doc.saveAs(psdFile, new PhotoshopSaveOptions(), true, Extension.LOWERCASE);
}

main();

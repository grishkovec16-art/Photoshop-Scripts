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
        alert("Ошибка: Откройте PSD шаблон!");
        return;
    }

    var doc = app.activeDocument;
    var rootFolder = Folder.selectDialog("Выберите папку с именами учеников");
    if (!rootFolder) return;

    // --- ДИАЛОГ ВЫБОРА ТИПОГРАФИИ ---
    var printChoice = "Other"; // По умолчанию
    var spreadNum = "01";      // Номер разворота для Фотофиеры

    var win = new Window("dialog", "Настройка экспорта");
    win.orientation = "column"; 
    win.alignChildren = ["fill", "top"];
    win.spacing = 15;
    win.margins = 20;
    
    win.add("statictext", undefined, "Выберите типографию:");
    var rbOther = win.add("radiobutton", undefined, "Сторонние типографии (имена папок)");
    var rbPhotofier = win.add("radiobutton", undefined, "Фотофиера (формат YY-XXX)");
    rbOther.value = true;

    var spreadGroup = win.add("group");
    spreadGroup.add("statictext", undefined, "Номер разворота (YY):");
    var spreadInput = spreadGroup.add("edittext", undefined, "01");
    spreadInput.characters = 5;
    spreadGroup.enabled = false;

    rbPhotofier.onClick = function() { spreadGroup.enabled = true; };
    rbOther.onClick = function() { spreadGroup.enabled = false; };

    var btnGroup = win.add("group");
    btnGroup.alignment = "center";
    btnGroup.add("button", undefined, "ОК", {name: "ok"});
    btnGroup.add("button", undefined, "Отмена", {name: "cancel"});

    if (win.show() != 1) return;

    printChoice = rbOther.value ? "Other" : "Photofier";
    spreadNum = spreadInput.text;

    // --- ПОДГОТОВКА ПАПКИ ---
    var outputFolder = new Folder(rootFolder.parent + "/Individual_Spreads_Result");
    if (!outputFolder.exists) outputFolder.create();

    var childFolders = rootFolder.getFiles(function(f) {
        return (f instanceof Folder) && (f.name.indexOf("Output") === -1) && (f.name.indexOf("Result") === -1);
    });

    // --- ЦИКЛ ОБРАБОТКИ ---
    for (var i = 0; i < childFolders.length; i++) {
        var currentFolder = childFolders[i];
        
        // Берем первые два JPG из папки
        var photos = currentFolder.getFiles(/\.(jpg|jpeg|png|tif)$/i);
        photos.sort();

        if (photos.length < 2) {
            $.writeln("Пропуск " + currentFolder.name + ": нужно минимум 2 фото.");
            continue;
        }

        var addedLayers = [];

        try {
            // Вставляем первое фото в Основа_1
            addedLayers.push(processPhoto(doc, "Основа_1", photos[0]));
            
            // Вставляем второе фото в Основа_2
            addedLayers.push(processPhoto(doc, "Основа_2", photos[1]));

            // Имя файла
            var fileName;
            if (printChoice === "Photofier") {
                var index = i + 1;
                var padIndex = ("000" + index).slice(-3);
                fileName = spreadNum + "-" + padIndex;
            } else {
                fileName = currentFolder.name;
            }

            // Сохранение
            saveFiles(doc, outputFolder, fileName);

            // Очистка (удаляем вставленные слои)
            for (var j = 0; j < addedLayers.length; j++) {
                if (addedLayers[j]) addedLayers[j].remove();
            }

        } catch (e) {
            alert("Ошибка в папке " + currentFolder.name + ": " + e);
        }
    }

    alert("Готово! Результаты сохранены в папку Individual_Spreads_Result.");
    outputFolder.execute();
}

function processPhoto(doc, baseName, photoPath) {
    var baseLayer = doc.layers.getByName(baseName);
    doc.activeLayer = baseLayer;

    var desc = new ActionDescriptor();
    desc.putPath(charIDToTypeID("null"), new File(photoPath));
    executeAction(charIDToTypeID("Plc "), desc, DialogModes.NO);

    var photoLayer = doc.activeLayer;
    
    // Кадрирование (Fill)
    smartCrop(photoLayer, baseLayer);

    // Создаем обтравочную маску (Clipping Mask)
    executeAction(stringIDToTypeID("groupEvent"), undefined, DialogModes.NO);
    
    return photoLayer;
}

function smartCrop(photo, base) {
    var pB = photo.bounds; 
    var bB = base.bounds;
    
    var pW = pB[2] - pB[0]; 
    var pH = pB[3] - pB[1];
    var bW = bB[2] - bB[0]; 
    var bH = bB[3] - bB[1];
    
    var ratio = Math.max(bW / pW, bH / pH) * 100;
    photo.resize(ratio, ratio, AnchorPosition.MIDDLECENTER);
    
    var pNewB = photo.bounds;
    var pCenter = [pNewB[0] + (pNewB[2]-pNewB[0])/2, pNewB[1] + (pNewB[3]-pNewB[1])/2];
    var bCenter = [bB[0] + bW/2, bB[1] + bH/2];
    
    photo.translate(bCenter[0] - pCenter[0], bCenter[1] - pCenter[1]);
}

function saveFiles(doc, folder, name) {
    var jpgFile = new File(folder + "/" + name + ".jpg");
    var jpgOpt = new JPEGSaveOptions();
    jpgOpt.formatOptions = FormatOptions.OPTIMIZEDBASELINE;
    jpgOpt.quality = 12;
    doc.saveAs(jpgFile, jpgOpt, true, Extension.LOWERCASE);
}

main();

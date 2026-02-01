#target photoshop

function main() {
    // 1. Выбор папки с исходными JPG (где имена детей)
    var inputFolder = Folder.selectDialog("Выберите папку с JPG (например, Output_Ready)");
    if (!inputFolder) return;

    // 2. Создание папки для типографии (рядом с папкой Output_Ready)
    var outputFolder = new Folder(inputFolder.parent + "/Печать фотофиера");
    if (!outputFolder.exists) outputFolder.create();

    // 3. Поиск всех JPG
    var files = inputFolder.getFiles(/\.(jpg|jpeg)$/i);
    
    // Сортировка по имени, чтобы порядок 001, 002 соответствовал алфавиту фамилий
    files.sort();

    if (files.length === 0) {
        alert("В выбранной папке не найдено JPG файлов!");
        return;
    }

    // 4. Процесс копирования и переименования
    for (var i = 0; i < files.length; i++) {
        var sourceFile = files[i];
        var index = i + 1;
        
        // Форматирование номера: 1 -> 001, 10 -> 010
        var padIndex = ("000" + index).slice(-3);
        var newName = "00-" + padIndex + ".jpg";
        
        var destFile = new File(outputFolder + "/" + newName);
        
        // ВАЖНО: Используем копирование, чтобы исходники остались на месте
        if (sourceFile.copy(destFile)) {
            // Файл успешно скопирован под новым именем
        }
    }

    alert("Успешно!\nСкопировано и переименовано: " + files.length + " шт.\nПапка: " + outputFolder.fsName);
    outputFolder.execute(); // Открыть готовую папку
}

main();

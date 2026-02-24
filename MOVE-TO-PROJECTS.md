# Перенос qpick в отдельную папку

Чтобы работать с сервисом сертификатов отдельно от проекта примерочной (tvoisty), перенеси репозиторий в `~/projects/qpick`.

## В терминале выполни:

```bash
# Создать папку проектов (если ещё нет)
mkdir -p ~/projects

# Вариант А: скопировать из tvoisty (сохранится .git и история)
cp -r /Users/lena/tvoisty/qpick ~/projects/qpick

# Вариант Б: клонировать заново с GitHub (чистый клон)
# cd ~/projects && git clone https://github.com/HelenSolS/qpick.git
```

## Дальше

1. В Cursor: **File → Open Folder** → выбери `~/projects/qpick`.
2. Работай только в этом окне — примерочная (tvoisty) не открыта, ничего не мешает.

После открытия workspace qpick можно продолжать доработку сервиса сертификатов.

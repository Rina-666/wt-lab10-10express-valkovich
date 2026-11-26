const express = require("express");
const pool = require("./db");

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Главный маршрут
app.get("/", (req, res) => {
    res.send("Express работает!");
});

// Информационный маршрут
app.get("/api/info", (req, res) => {
    res.json({
        application: "Web Technologies",
        technology: "Node.js + Express",
        database: "PostgreSQL"
    });
});

// Тестовый POST-маршрут
app.post("/api/test", (req, res) => {
    res.json({
        message: "Данные получены",
        data: req.body
    });
});

// Проверка подключения к базе данных PostgreSQL
app.get("/api/db-test", async (req, res) => {
    try {
        const result = await pool.query("SELECT NOW() AS current_time");
        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Ошибка подключения к базе данных" });
    }
});

// Поиск книг по названию (обязательно до /api/products/:id)
app.get("/api/products/search", async (req, res) => {
    try {
        const name = req.query.name || "";
        const result = await pool.query(
            `SELECT "Id", "Title", "Author", "Genre", "Year", "Pages", "ISBN", "Price", "IsAvailable", "Description", "ImageUrl"
       FROM "Books"
       WHERE "Title" ILIKE $1
       ORDER BY "Id"`,
            [`%${name}%`]
        );
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Ошибка поиска" });
    }
});

// Список всех книг
app.get("/api/products", async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT "Id", "Title", "Author", "Genre", "Year", "Pages", "ISBN", "Price", "IsAvailable", "Description", "ImageUrl"
       FROM "Books"
       ORDER BY "Id"`
        );
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Ошибка получения товаров" });
    }
});

// Получить книгу по ID
app.get("/api/products/:id", async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ error: "Некорректный идентификатор" });
        }

        const result = await pool.query(
            `SELECT "Id", "Title", "Author", "Genre", "Year", "Pages", "ISBN", "Price", "IsAvailable", "Description", "ImageUrl"
       FROM "Books"
       WHERE "Id" = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Товар не найден" });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Ошибка получения товара" });
    }
});

// Добавить книгу
app.post("/api/products", async (req, res) => {
    try {
        const {
            title,
            author,
            genre,
            year,
            pages,
            isbn,
            price,
            isAvailable,
            description,
            imageUrl
        } = req.body;
        const numericPrice = Number(price);

        if (
            !title ||
            typeof title !== "string" ||
            !title.trim() ||
            !genre ||
            typeof genre !== "string" ||
            !genre.trim() ||
            price === undefined ||
            Number.isNaN(numericPrice) ||
            numericPrice < 0 ||
            typeof isAvailable !== "boolean"
        ) {
            return res.status(400).json({ error: "Некорректные данные товара" });
        }

        const numericPages = pages !== undefined && pages !== null ? Number(pages) : 0;
        const isbnValue =
            typeof isbn === "string" && isbn.trim() ? isbn.trim() : "000-0-00-000000-0";
        const imageUrlValue =
            typeof imageUrl === "string" && imageUrl.trim() ? imageUrl.trim() : "";

        const result = await pool.query(
            `INSERT INTO "Books" ("Title", "Author", "Genre", "Year", "Pages", "ISBN", "Price", "IsAvailable", "Description", "ImageUrl")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING "Id", "Title", "Author", "Genre", "Year", "Pages", "ISBN", "Price", "IsAvailable", "Description", "ImageUrl"`,
            [
                title.trim(),
                (author || "Не указан").trim(),
                genre.trim(),
                year ? Number(year) : 2026,
                Number.isNaN(numericPages) ? 0 : numericPages,
                isbnValue,
                numericPrice,
                isAvailable,
                description ?? null,
                imageUrlValue
            ]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Ошибка создания товара" });
    }
});

// Изменить книгу по ID
app.put("/api/products/:id", async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ error: "Некорректный идентификатор" });
        }

        const {
            title,
            author,
            genre,
            year,
            pages,
            isbn,
            price,
            isAvailable,
            description,
            imageUrl
        } = req.body;
        const numericPrice = Number(price);

        if (
            !title ||
            typeof title !== "string" ||
            !title.trim() ||
            !genre ||
            typeof genre !== "string" ||
            !genre.trim() ||
            price === undefined ||
            Number.isNaN(numericPrice) ||
            numericPrice < 0 ||
            typeof isAvailable !== "boolean"
        ) {
            return res.status(400).json({ error: "Некорректные данные товара" });
        }

        const numericPages =
            pages !== undefined && pages !== null && !Number.isNaN(Number(pages))
                ? Number(pages)
                : null;
        const isbnValue =
            typeof isbn === "string" && isbn.trim() ? isbn.trim() : null;
        const imageUrlValue =
            typeof imageUrl === "string" && imageUrl.trim() ? imageUrl.trim() : null;

        const result = await pool.query(
            `UPDATE "Books"
       SET "Title" = $1,
           "Author" = COALESCE($2, "Author"),
           "Genre" = $3,
           "Year" = COALESCE($4, "Year"),
           "Pages" = COALESCE($5, "Pages"),
           "ISBN" = COALESCE($6, "ISBN"),
           "Price" = $7,
           "IsAvailable" = $8,
           "Description" = $9,
           "ImageUrl" = COALESCE($10, "ImageUrl")
       WHERE "Id" = $11
       RETURNING "Id", "Title", "Author", "Genre", "Year", "Pages", "ISBN", "Price", "IsAvailable", "Description", "ImageUrl"`,
            [
                title.trim(),
                author ? author.trim() : null,
                genre.trim(),
                year ? Number(year) : null,
                numericPages,
                isbnValue,
                numericPrice,
                isAvailable,
                description ?? null,
                imageUrlValue,
                id
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Товар не найден" });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Ошибка изменения товара" });
    }
});

// Удалить книгу по ID
app.delete("/api/products/:id", async (req, res) => {
    try {
        const id = Number(req.params.id);
        if (!Number.isInteger(id) || id <= 0) {
            return res.status(400).json({ error: "Некорректный идентификатор" });
        }

        const result = await pool.query(
            `DELETE FROM "Books"
       WHERE "Id" = $1
       RETURNING "Id", "Title", "Author", "Genre", "Year", "Pages", "ISBN", "Price", "IsAvailable", "Description", "ImageUrl"`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Товар не найден" });
        }

        res.json({
            message: "Товар удалён",
            product: result.rows[0]
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Ошибка удаления товара" });
    }
});

// Обработчик неизвестного маршрута
app.use((req, res) => {
    res.status(404).json({ error: "Маршрут не найден" });
});

app.listen(port, "0.0.0.0", () => {
    console.log(`Server started on port ${port}`);
});
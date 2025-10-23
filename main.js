// main.js — HTTP сервер для варіанту 5 (mtcars.json)
const { Command } = require('commander');
const http = require('http');
const fs = require('fs/promises');
const { XMLBuilder } = require('fast-xml-parser');

//  Налаштування CLI параметрів
const program = new Command();
program
  .requiredOption('-i, --input <path>', 'Path to JSON input file')
  .requiredOption('-h, --host <host>', 'Server host')
  .requiredOption('-p, --port <port>', 'Server port');

program.parse(process.argv);
const { input, host, port } = program.opts();

//  Функція для читання JSON
async function readJsonFile(filePath) {
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch {
    console.error('Cannot find input file');
    process.exit(1);
  }
}

// HTTP сервер
const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const params = url.searchParams;

    // читаємо JSON
    const data = await readJsonFile(input);

    // Фільтрація за параметрами URL
    let filtered = data;
    const maxMpg = params.get('max_mpg');
    const showCylinders = params.get('cylinders') === 'true';

    if (maxMpg) {
      filtered = filtered.filter(car => car.mpg < parseFloat(maxMpg));
    }

    // Формування XML-об’єкту
    const xmlData = {
      cars: filtered.map(car => ({
        car: {
          model: car.model,
          ...(showCylinders && { cyl: car.cyl }),
          mpg: car.mpg
        }
      }))
    };

    // Конвертація у XML
    const builder = new XMLBuilder({ format: true });
    const xmlOutput = builder.build(xmlData);

    // Відповідь
    res.writeHead(200, { 'Content-Type': 'application/xml' });
    res.end(xmlOutput);

  } catch (err) {
    console.error(err);
    res.writeHead(500);
    res.end('Server error');
  }
});

// Запуск
server.listen(Number(port), host, () => {
  console.log(`Server running at http://${host}:${port}/`);
});


const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 4000;

// Middleware para servir archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Leer datos desde ebooks.json
const readEbooks = () => {
  return new Promise((resolve, reject) => {
    fs.readFile(path.join(__dirname, 'ebooks.json'), 'utf8', (err, data) => {
      if (err) {
        return reject(err);
      }
      resolve(JSON.parse(data));
    });
  });
};

// Ruta raíz
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Ruta para obtener todos los autores
app.get('/api', async (req, res) => {
  try {
    const ebooks = await readEbooks();
    const autores = ebooks.map(ebook => ({
      apellido: ebook.autor_apellido,
      nombre: ebook.autor_nombre
    }));
    autores.sort((a, b) => a.apellido.localeCompare(b.apellido)); // Ordenar alfabéticamente
    res.json(autores);
  } catch (error) {
    res.status(404).send('Error al leer los datos');
  }
});

// Ruta para obtener autores por apellido
app.get('/api/apellido/:apellido', async (req, res) => {
  const apellido = req.params.apellido;
  try {
    const ebooks = await readEbooks();
    const autores = ebooks.filter(ebook => ebook.autor_apellido.toLowerCase() === apellido.toLowerCase());
    res.json(autores);
  } catch (error) {
    res.status(404).send('Error al leer los datos');
  }
});

// Ruta para obtener autores por nombre y apellido
app.get('/api/nombre_apellido/:nombre/:apellido', async (req, res) => {
  const { nombre, apellido } = req.params;
  try {
    const ebooks = await readEbooks();
    const autores = ebooks.filter(ebook =>
      ebook.autor_nombre.toLowerCase() === nombre.toLowerCase() &&
      ebook.autor_apellido.toLowerCase() === apellido.toLowerCase()
    );
    res.json(autores);
  } catch (error) {
    res.status(404).send('Error al leer los datos');
  }
});

// Ruta para buscar autores por nombre y primeras letras del apellido
app.get('/api/nombre', async (req, res) => {
  const { apellido } = req.query;
  if (!apellido) {
    return res.status(400).send('Falta el parámetro apellido');
  }
  try {
    const ebooks = await readEbooks();
    const autores = ebooks.filter(ebook => 
      ebook.autor_nombre.toLowerCase() === req.query.nombre.toLowerCase() && 
      ebook.autor_apellido.toLowerCase().startsWith(apellido.toLowerCase())
    );
    res.json(autores);
  } catch (error) {
    res.status(404).send('Error al leer los datos');
  }
});

// Ruta para obtener obras por año de edición
app.get('/api/edicion/:anio', async (req, res) => {
  const anio = parseInt(req.params.anio);
  try {
    const ebooks = await readEbooks();
    const obras = ebooks.flatMap(ebook => 
      ebook.obras.filter(obra => obra.edicion === anio)
    );
    res.json(obras);
  } catch (error) {
    res.status(404).send('Error al leer los datos');
  }
});

// Manejo de rutas no encontradas (404)
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'public', '404.html'));
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

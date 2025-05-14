const express = require('express');
const cors = require('cors');
const db = require("./db");

const corsOptions = {
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: false
};

const app = express();
const PORT = 3002;

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Obtener todos los productos
app.get('/api/productos', (req, res) => {
  const query = 'SELECT * FROM productos';

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error al obtener productos:', err);
      return res.status(500).json({ message: 'Error al obtener productos' });
    }
    res.status(200).json(results.rows);
  });
});

// Crear un nuevo producto
app.post('/api/productos', (req, res) => {
  const {
    nombre_producto,
    descripcion,
    precio_unitario,
    stock,
    id_proveedor,
    fecha,
    unidad
  } = req.body;

  if (!nombre_producto || isNaN(precio_unitario)) {
    return res.status(400).json({ message: 'Faltan datos obligatorios o hay errores en los datos' });
  }

  const query = `
    INSERT INTO productos (
      nombre_producto, descripcion, precio_unitario, stock, id_proveedor, fecha, unidad
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING id_producto
  `;

  db.query(query, [
    nombre_producto,
    descripcion || null,
    parseFloat(precio_unitario),
    stock ? parseInt(stock) : null,
    id_proveedor ? parseInt(id_proveedor) : null,
    fecha || null,
    unidad || null
  ], (err, result) => {
    if (err) {
      console.error('Error al insertar producto:', err);
      return res.status(500).json({ message: 'Error interno al guardar el producto' });
    }

    res.status(201).json({
      message: 'Producto guardado exitosamente',
      id: result.rows[0].id_producto
    });
  });
});

// Actualizar un producto
app.put('/api/productos/:id', (req, res) => {
  const { id } = req.params;
  const { nombre_producto, descripcion, precio_unitario, stock, id_proveedor, fecha, unidad } = req.body;

  if (!nombre_producto || isNaN(precio_unitario)) {
    return res.status(400).json({ message: 'Faltan datos obligatorios o hay errores en los datos' });
  }

  const query = `
    UPDATE productos 
    SET nombre_producto = $1, descripcion = $2, precio_unitario = $3, stock = $4, id_proveedor = $5, fecha = $6, unidad = $7
    WHERE id_producto = $8
  `;

  db.query(query, [
    nombre_producto,
    descripcion || null,
    parseFloat(precio_unitario),
    stock ? parseInt(stock) : null,
    id_proveedor ? parseInt(id_proveedor) : null,
    fecha || null,
    unidad || null,
    parseInt(id)
  ], (err, result) => {
    if (err) {
      console.error('Error al actualizar producto:', err);
      return res.status(500).json({ message: 'Error interno al actualizar el producto' });
    }
    res.status(200).json({ message: 'Producto actualizado exitosamente' });
  });
});

// Eliminar un producto
app.delete('/api/productos/:id', (req, res) => {
  const { id } = req.params;

  const query = 'DELETE FROM productos WHERE id_producto = $1';

  db.query(query, [parseInt(id)], (err, result) => {
    if (err) {
      console.error('Error al eliminar producto:', err);
      return res.status(500).json({ message: 'Error interno al eliminar el producto' });
    }
    res.status(200).json({ message: 'Producto eliminado exitosamente' });
  });
});

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error('Error global:', err);
  res.status(500).json({ message: 'Error interno del servidor' });
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});


/*------------------------------BUSQUEDA-------------------------------*/



app.get('/api/productos/buscar', async (req, res) => {
  try {
    const nombre = req.query.nombre;  // Obtener el parámetro "nombre" de la consulta

    // Verifica si el parámetro es proporcionado
    if (!nombre) {
      return res.status(400).json({ error: 'Falta el parámetro "nombre"' });
    }

    // Realizar la consulta SQL usando LIKE para buscar el nombre
    const resultado = await db.query(
      'SELECT * FROM productos WHERE nombre_producto ILIKE $1',  // ILIKE para búsqueda insensible a mayúsculas
      [`%${nombre}%`]  // Usar "%" para hacer la búsqueda más flexible (como "ju" encontraría "Juguete", etc.)
    );

    // Verificar si no se encontraron productos
    if (resultado.rows.length === 0) {
      return res.status(404).json({ message: 'No se encontraron productos' });
    }

    // Retornar los resultados
    res.json(resultado.rows);
  } catch (error) {
    console.error('Error al buscar el producto:', error);  // Imprimir el error en consola
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});


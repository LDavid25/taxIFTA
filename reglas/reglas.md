## **IFTA Easy Tax System**

Desarrollar un sistema web llamado **“IFTA Easy Tax System”**, orientado a empresas de transporte, para que una empresa gestora administre el cálculo y la presentación del impuesto IFTA de múltiples clientes transportistas. El sistema incluye backend, frontend y base de datos, organizado en módulos funcionales.

---

### 1. **Usuarios y Acceso**

* **Roles definidos:**

  * **Administrador:** pertenece a la empresa gestora. Tiene acceso total al sistema.
  * **Cliente (Contador):** pertenece a una empresa de transporte. Accede solo a los datos de su compañía.
* **Acceso al sistema:**

  * Registro e inicio de sesión.
  * El administrador puede ver y gestionar múltiples compañías y sus usuarios.
  * Cada cliente pertenece a una compañía específica.

---

### 2. **Empresas y Vehículos**

* Registro de empresas: nombre, dirección, contacto.
* Cada empresa puede registrar múltiples vehículos (por matrícula o identificador único).

---

### 3. **Carga de Viajes**

* Carga manual o importación desde archivo CSV/Excel.
* Datos mínimos: vehículo, fecha, estado/provincia, millas, galones, comprobante (PDF o imagen), mes y trimestre.
* Cada viaje pertenece a una compañía y a un vehículo.

---

### 4. **Declaraciones Trimestrales**

* Los viajes se agrupan por trimestre (4 al año) y por vehículo.
* El cliente puede consultar un resumen acumulado con:

  * Estados/provincias recorridas.
  * Total de millas.
  * Total de galones.
  * MPG promedio.
* Al completar el trimestre, la declaración pasa por los siguientes estados (gestionados por el administrador):

  * **Recibido** (por defecto)
  * **En progreso**
  * **Completado**
  * **Cancelado**
* Al completarse, el administrador puede adjuntar un archivo final (ej: PDF oficial).

---

### 5. **Roles y Funciones**

#### 🟢 Cliente

* Accede a sus propios datos.
* Crea declaraciones por trimestre.
* Registra viajes y adjunta comprobantes.
* Visualiza el estado de sus declaraciones.
* Descarga reportes en PDF.
* Confirma que los datos ingresados son verídicos (checkbox obligatorio).
* No puede editar datos confirmados ni ver otras compañías.

#### 🔵 Administrador

* Accede a todas las compañías, usuarios y declaraciones.
* Cambia el estado de las declaraciones.
* Visualiza y analiza datos cargados por los clientes.
* Adjunta archivos a declaraciones completadas.
* Calcula el impuesto IFTA automáticamente.
* Genera reportes PDF.
* Envía recordatorios por email antes del cierre de trimestre.
* Panel con estadísticas:

  * Cantidad de compañías y declaraciones.
  * Estado de avance.
  * Promedios de MPG.
  * Jurisdicciones más recorridas.
  * Alertas de empresas sin actividad reciente.

---

### 6. **Cálculo Automático IFTA**

* Por trimestre y por compañía.
* Se calcula por estado:

  * Millas, galones, tasa vigente, impuesto a pagar.
* Se genera una tabla resumen que el administrador puede revisar antes de generar el PDF.

---

### 7. **Reportes y Historial**

* PDF por trimestre, descargable por cliente y administrador.
* Histórico de reportes por año.

---

### 8. **Tecnología Recomendada**

* **Frontend:** ReactJS + Material UI
* **Backend:** Node.js + Express
* **Base de datos:** PostgreSQL
* **Visualización:** Chart.js
* **PDFs:** Librería como `pdfmake` o `jsPDF`
* **Emails:** Nodemailer o SendGrid

---

### 9. **Base de Datos (Simplificada)**

* **companies**
* **users** (con rol y compañía asociada)
* **vehicles**
* **trips**
* **declarations**
* **tax\_rates**
* **reports**

---

### 10. **Extras**

* Emails automáticos antes de la fecha de cierre de trimestre.
* Interfaz simple y paso a paso para que el cliente cargue sus datos.
* Validación básica y controles visuales amigables.


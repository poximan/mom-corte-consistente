# Corte Consistente
Servicio de corte consistente para una arquitectura mom (message-oriented middleware).
Se trata de una implimentacion del algoritmo de instantanea de Chandy-Lamport, para determinar estados globales.
Registra un conjunto de estados de procesos y canales, tal que el estado global sea consistente.
<br/>

![alt text](https://github.com/poximan/mom-nucleo/tree/master/imagenes/nucleo.png "Arquitectura")<br/>

## Caso de estudio
Aqui https://github.com/poximan/mama_node hay caso de estudio completo que implementa este modulo.<br/>

## Parametros
param 1 = {Object mom-bus-comunic} instancia de bus para gestion de eventos. Ver https://www.npmjs.com/package/mom-bus-comunic

param 2 = {entero} cantidad de confirmaciones externas para fin corte consistente.

param 3 = {[Object]} Estado actual del servidor. Es el arreglo de valores en memoria dinamica.

param 4 = {Function} llamada a funcion de persistencia del negocio.<br/>

param 5 = {Funtion} llamada a funcion de publicacion usada en middleware (ver https://www.npmjs.com/package/mom-nucleo).<br/>

## Modo de uso

### Alta corte consistente
```
var corte_consistente = require("mom-corte-consistente")(
  bus,
  corte_resp_esperadas,
  [estado_actual_servidor],
  funcionPersistencia,
  funcionPublicar
);
```
Con esto se solicita una instancia de modulo corte consistente. No tiene dependencias con el negocio.

### Corte en proceso
```
corte_consistente.corteEnProceso();
```
Funcion de consulta para saber si esta ejecutandose (o no) un corte consistente.
Retorna V o F.

### Solicitud de corte
```
corte_consistente.iniciarCorte();
```
Ofrece servicio de iniciar corte consistente.

### socket del monitor
```
corte_consistente.sockRespuesta(socket);
```
Funcion de entrada al modulo, para setear quien es el socket abierto entre el servidor del negocio (del que forma parte) y el concentrador/monitor.
Esta informacion sera util cuando desee reportar un fin de corte consistente al monitor.

### registrar operacion
```
corte_consistente.registrar(msg_mom);
```
Funcion para guardar el canal de entrada en la medida que van llegando los nuevos mensajes al middleware durante un corte consistente.
Cuando se reciben todas las respuestas esperadas, esta funcion finaliza el proceso de corte y reporta el resultado.

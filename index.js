/*
param 1 = instancia de bus para gestion de eventos
param 2 = cantidad de confirmaciones externas para fin corte consistente
param 3 = estado actual del servidor. son los valores en memoria dinamica
param 4 = llamada a funcion de persistencia del negocio
param 5 = driver publicador para una arquitectura MOM
*/
module.exports = function(
  bus,
  corte_resp_esperadas,
  estado_servidor,
  persistir,
  publicar
) {

  var module = {};

  /*
  ......... corte consistente
  */

  module.corte_en_proceso = false;

  /*
  numero de respuestas que espera el servidor
  antes de confirmar el fin del algoritmo corte consistente
  */
  var corte_resp_recibidas = 0;

  var canal_entrante = new Array();

  /*
  si llega un pedido de corte consistente desde la cola de mensajes
  este servidor deberá iniciar un proceso de propagacion del corte con
  todos los canales de comunicacion abiertos (los servidores con los que intercambia informacion)
  */
  bus.on("momCorte", function () {

    module.corte_en_proceso = true;

    console.log("ENT: procesando pedido corte consistente");
    if(corte_resp_esperadas > 1)
      console.log("INT: se esperan " + corte_resp_esperadas + " respuestas de otros servidores");
    else
      console.log("INT: se espera " + corte_resp_esperadas + " respuesta desde otro servidor");

    persistir();
    publicar();
  });

  /*
  estas solicitudes pueden entrar desde el modo automatico en forma periodica y probabalista,
  o desde el monitor cuando el sistema funciona en manual y el usuario lo solicita
  */
  module.iniciarCorte = function(){

    if (corte_resp_recibidas == corte_resp_esperadas)
      return;

    console.log("GLOBAL: comienza corte consistente");
    var msg = {mw:"momCorte"};
    bus.emit(msg.mw, null);
  }

  var sock_respuesta;
  module.sockRespuesta = function(socket) {
    sock_respuesta = socket;
  }

  module.registrar = function(msg_mom){

    if(msg_mom.mw === "momCorte")
      corte_resp_recibidas++;

    canal_entrante.push(msg_mom);

    if (corte_resp_recibidas >= corte_resp_esperadas){

      console.log("INT: se recibieron " + corte_resp_recibidas + " respuestas de otros servidores");

      var msg = {ent:canal_entrante.slice(0), est:estado_servidor().slice(0)};

      console.log("mensajes entrantes -->");
      msg.ent.forEach(function(actual){

        var texto;

        if(actual.mw === "momCorte")
          texto = actual;
        else {
          texto = "compra " + actual.evento.id + " => " +
          actual.evento.compra.estado + " : " +
          actual.evento.compra.entrega + " : " +
          actual.evento.compra.reserva + " : " +
          actual.evento.compra.pago + " : " +
          actual.evento.compra.infracciones + " : " +
          actual.evento.compra.medio;
        }

        console.log(texto);
      });

      console.log("en memoria -->");
      msg.est.forEach(function(actual){

        var texto = "compra " + actual.id + " => " +
        actual.compra.estado + " : " +
        actual.compra.entrega + " : " +
        actual.compra.reserva + " : " +
        actual.compra.pago + " : " +
        actual.compra.infracciones + " : " +
        actual.compra.medio;

        console.log(texto);
      });

      if(sock_respuesta !== undefined)
        sock_respuesta.emit("resCorte", msg);

      corte_resp_recibidas = 0;
      module.corte_en_proceso = false;
      canal_entrante.length = 0;

      console.log("INT: fin corte consistente");
    }
  }

  return module;
};

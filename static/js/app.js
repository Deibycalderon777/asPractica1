function activeMenuOption(href) {
    $(".app-menu .nav-link")
    .removeClass("active")
    .removeAttr('aria-current')

    $(`[href="${(href ? href : "#/")}"]`)
    .addClass("active")
    .attr("aria-current", "page")
}

const app = angular.module("angularjsApp", ["ngRoute"])
app.config(function ($routeProvider, $locationProvider) {
    $locationProvider.hashPrefix("")

    $routeProvider
    .when("/", {
        templateUrl: "/app",
        controller: "appCtrl"
    })
    .when("/postres", {
        templateUrl: "/postres",
        controller: "postresCtrl"
    })
    .when("/ingredientes", {
        templateUrl: "/ingredientes",
        controller: "ingredientesCtrl"
    })
    .otherwise({
        redirectTo: "/"
    })
})

app.run(["$rootScope", "$location", "$timeout", function($rootScope, $location, $timeout) {
    function actualizarFechaHora() {
        lxFechaHora = DateTime
        .now()
        .setLocale("es")

        $rootScope.angularjsHora = lxFechaHora.toFormat("hh:mm:ss a")
        $timeout(actualizarFechaHora, 1000)
    }

    $rootScope.slide = ""

    actualizarFechaHora()

    $rootScope.$on("$routeChangeSuccess", function (event, current, previous) {
        $("html").css("overflow-x", "hidden")
        
        const path = current.$$route.originalPath

        if (path.indexOf("splash") == -1) {
            const active = $(".app-menu .nav-link.active").parent().index()
            const click  = $(`[href^="#${path}"]`).parent().index()

            if (active != click) {
                $rootScope.slide  = "animate__animated animate__faster animate__slideIn"
                $rootScope.slide += ((active > click) ? "Left" : "Right")
            }

            $timeout(function () {
                $("html").css("overflow-x", "auto")
                $rootScope.slide = ""
            }, 1000)

            activeMenuOption(`#${path}`)
        }
    })
}])

app.controller("appCtrl", function ($scope, $http) {
})
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// ======================================
// CONTROLLER DE POSTRES
// ======================================
app.controller("postresCtrl", function ($scope, $http) {
    function buscarPostres() {
        $.get("/tbodyPostres", function (trsHTML) {
            $("#tbodyPostres").html(trsHTML)
        })
    }

    // Función para limpiar formulario de postres
    function limpiarFormularioPostre() {
        $("#frmPostre")[0].reset()
        $("#hiddenIdPostre").remove()
    }

    buscarPostres() 
    
    // Enable pusher logging - don't include this in production

    Pusher.logToConsole = true
    ////////////////////////////////////////////////////////se agrego esta lineas de codigo, quitar si no funciona
     // AGREGAR VERIFICACIÓN PARA EVITAR PUSHER DUPLICADO:
    if (typeof window.pusherPostres === 'undefined') {
        window.pusherPostres = new Pusher('df675041e275bafce4a7', {
            cluster: 'mt1'
        });

        var channel = window.pusherPostres.subscribe("canalPostres");
        channel.bind("eventoPostres", function(data) {
            console.log("Evento Pusher recibido:", data);
            buscarPostres();
        });
    }

    ///////////////////////////////////////////////////////////

   var pusher = new Pusher('df675041e275bafce4a7', {
      cluster: 'mt1'
    });

    var channel = pusher.subscribe("canalPostres")
    channel.bind("eventoPostres", function(data) {
        // alert(JSON.stringify(data))
        buscarPostres()
    })

    // Guardar/actualizar postre
    $(document).on("submit", "#frmPostre", function (event) {
        event.preventDefault()

        $.post("/postre", {
            idPostre: $("#hiddenIdPostre").val() || "",
            nombrePostre: $("#txtNombre").val(),
            precio: $("#txtPrecio").val()
        }, function(response) {
            // Callback de éxito
            console.log("Postre guardado:", response)
            // Limpiar formulario
            limpiarFormularioPostre()
            // Actualizar tabla
            buscarPostres()
            // Mostrar mensaje de éxito
            toast("Postre guardado correctamente", 3, function() {
                console.log("Toast terminado")
            })
        }).fail(function(xhr, status, error) {
            console.error("Error al guardar postre:", error)
            alert("Error al guardar el postre")
        })
    })
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// se agrego estas lineas de codigo para poder cerrar el modal correctamente 
    // Ver ingredientes de un postre
    $(document).off("click", ".btn-ingredientes").on("click", ".btn-ingredientes", function (event) {
        event.preventDefault();
        // Usar minúsculas porque jQuery convierte automáticamente
        const id = $(this).data("idpostre");
        console.log("ID capturado:", id);
        if (id && id !== 'undefined' && id !== undefined) {
            $.get(`/postres/ingredientes/${id}`, function (html) {
                modal(html, "Ingredientes del Postre", [
                    {html: "Cerrar", class: "btn btn-secondary", fun: function (event) {
                        $(event.target).blur();
                        closeModal()
                    }}
                ])
            }).fail(function(xhr, status, error) {
                console.error("Error al cargar ingredientes:", error);
                alert("Error al cargar ingredientes: " + error);
            });
        } else {
            console.error("ID no encontrado");
            alert("Error: No se pudo obtener el ID del postre");
        }
    })
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Editar postre
    $(document).on("click", ".btn-editar-postre", function (event) {
        const id = $(this).data("id")
        
        $.get(`/postre/${id}`, function (data) {
            if (data.length > 0) {
                const postre = data[0]
                $("#txtNombre").val(postre.nombrePostre)
                $("#txtPrecio").val(postre.precio)
                
                // Agregar campo hidden para el ID
                if ($("#hiddenIdPostre").length === 0) {
                    $("#frmPostre").prepend('<input type="hidden" id="hiddenIdPostre" name="idPostre">')
                }
                $("#hiddenIdPostre").val(postre.idPostre)
                
                // Scroll hacia el formulario
                $('html, body').animate({
                    scrollTop: $("#frmPostre").offset().top
                }, 500)
            }
        }).fail(function(xhr, status, error) {
            console.error("Error al cargar postre:", error)
            alert("Error al cargar los datos del postre")
        })
    })
//////////////////////////////////////////////////////////////////////////////////////////////////////
   // se reemplazo esta linea de codigo para evitar que se dupliquen eventos 
    // Eliminar postre
    $(document).off("click", ".btn-eliminar-postre").on("click", ".btn-eliminar-postre", function (event) {
        const id = $(this).data("id")
        const $btn = $(this); // Guardar referencia al botón
        
        if (confirm("¿Está seguro de eliminar este postre?")) {
            // Deshabilitar el botón durante la petición
            $btn.prop('disabled', true);
            
            $.post("/postre/eliminar", {
                id: id
            }, function(response) {
                console.log("Postre eliminado:", response)
                buscarPostres()
                toast("Postre eliminado correctamente", 3)
            }).fail(function(xhr, status, error) {
                console.error("Error al eliminar postre:", error)
                alert("Error al eliminar el postre")
            }).always(function() {
                // Rehabilitar el botón
                $btn.prop('disabled', false);
            });
        }
    })

/////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Cancelar edición
    $(document).on("click", "#btnCancelarPostre", function (event) {
        limpiarFormularioPostre()
    })
})
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// ======================================
// CONTROLLER DE INGREDIENTES
// ======================================
app.controller("ingredientesCtrl", function ($scope, $http) {
    function buscarIngredientes() {
        $.get("/tbodyIngredientes", function (trsHTML) {
            $("#tbodyIngredientes").html(trsHTML)
        })
    }

    // Función para limpiar formulario de ingredientes
    function limpiarFormularioIngrediente() {
        $("#frmIngredientes")[0].reset()
        $("#hiddenIdIngrediente").remove()
    }

    buscarIngredientes()
    
    // Enable pusher logging - don't include this in production
    Pusher.logToConsole = true

    // Pusher para ingredientes
    var pusher = new Pusher("48294aad3f28c3669613", {
      cluster: "us2"
    })

    var channel = pusher.subscribe("canalIngredientes")
    channel.bind("eventoDeIngredientes", function(data) {
        // alert(JSON.stringify(data))
        buscarIngredientes()
    })

    // Guardar/actualizar ingrediente
    $(document).on("submit", "#frmIngredientes", function (event) {
        event.preventDefault()

        $.post("/ingrediente", {
            idIngrediente: $("#hiddenIdIngrediente").val() || "",
            nombreIngrediente: $("#txtNombre").val(),
            existencias: $("#txtExistencias").val()
        }, function(response) {
            // Callback de éxito
            console.log("Ingrediente guardado:", response)
            // Limpiar formulario
            limpiarFormularioIngrediente()
            // Actualizar tabla
            buscarIngredientes()
            // Mostrar mensaje de éxito
            toast("Ingrediente guardado correctamente", 3, function() {
                console.log("Toast terminado")
            })
        }).fail(function(xhr, status, error) {
            console.error("Error al guardar ingrediente:", error)
            alert("Error al guardar el ingrediente")
        })
    })

    // Editar ingrediente
    $(document).on("click", ".btn-editar-ingrediente", function (event) {
        const id = $(this).data("id")
        
        $.get(`/ingrediente/${id}`, function (data) {
            if (data.length > 0) {
                const ingrediente = data[0]
                $("#txtNombre").val(ingrediente.nombreIngrediente)
                $("#txtExistencias").val(ingrediente.existencias)
                
                // Agregar campo hidden para el ID
                if ($("#hiddenIdIngrediente").length === 0) {
                    $("#frmIngredientes").prepend('<input type="hidden" id="hiddenIdIngrediente" name="idIngrediente">')
                }
                $("#hiddenIdIngrediente").val(ingrediente.idIngrediente)
                
                // Scroll hacia el formulario
                $('html, body').animate({
                    scrollTop: $("#frmIngredientes").offset().top
                }, 500)
            }
        }).fail(function(xhr, status, error) {
            console.error("Error al cargar ingrediente:", error)
            alert("Error al cargar los datos del ingrediente")
        })
    })

    // Eliminar ingrediente
    $(document).on("click", ".btn-eliminar-ingrediente", function (event) {
        const id = $(this).data("id")
        
        if (confirm("¿Está seguro de eliminar este ingrediente?")) {
            $.post("/ingrediente/eliminar", {
                id: id
            }, function(response) {
                console.log("Ingrediente eliminado:", response)
                buscarIngredientes()
                toast("Ingrediente eliminado correctamente", 3)
            }).fail(function(xhr, status, error) {
                console.error("Error al eliminar ingrediente:", error)
                alert("Error al eliminar el ingrediente")
            })
        }
    })

    // Cancelar edición
    $(document).on("click", "#btnCancelarIngrediente", function (event) {
        limpiarFormularioIngrediente()
    })
})











////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// ======================================
// CONFIGURACIÓN DE FECHA Y HORA
// ======================================
const DateTime = luxon.DateTime
let lxFechaHora

document.addEventListener("DOMContentLoaded", function (event) {
    const configFechaHora = {
        locale: "es",
        weekNumbers: true,
        // enableTime: true,
        minuteIncrement: 15,
        altInput: true,
        altFormat: "d/F/Y",
        dateFormat: "Y-m-d",
        // time_24hr: false
    }

    activeMenuOption(location.hash)
})









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

// ======================================
// CONTROLLER DE POSTRES - CORREGIDO
// ======================================
app.controller("postresCtrl", function ($scope, $http) {
    function buscarPostres() {
        $.get("/tbodyPostres", function (trsHTML) {
            $("#tbodyPostres").html(trsHTML)
        })
    }

    function limpiarFormularioPostre() {
        $("#frmPostre")[0].reset()
        $("#hiddenIdPostre").remove()
    }

    buscarPostres() 
    
    // Desactivar logging de Pusher para producción
    Pusher.logToConsole = false;

    // Verificación para evitar Pusher duplicado
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

    // Guardar/actualizar postre
    $(document).off("submit", "#frmPostre").on("submit", "#frmPostre", function (event) {
        event.preventDefault()

        // Deshabilitar botón durante el envío
        const $submitBtn = $(this).find('button[type="submit"]');
        $submitBtn.prop('disabled', true);

        $.post("/postre", {
            idPostre: $("#hiddenIdPostre").val() || "",
            nombrePostre: $("#txtNombre").val(),
            precio: $("#txtPrecio").val()
        }, function(response) {
            console.log("Postre guardado:", response)
            limpiarFormularioPostre()
            buscarPostres()
            toast("Postre guardado correctamente", 3, function() {
                console.log("Toast terminado")
            })
        }).fail(function(xhr, status, error) {
            console.error("Error al guardar postre:", error)
            alert("Error al guardar el postre")
        }).always(function() {
            $submitBtn.prop('disabled', false);
        })
    })

    // Ver ingredientes de un postre
    $(document).off("click", ".btn-ingredientes").on("click", ".btn-ingredientes", function (event) {
        event.preventDefault();
        
        const id = $(this).data("idpostre");
        console.log("ID capturado:", id);
        
        if (id && id !== 'undefined' && id !== undefined) {
            $.get(`/postres/ingredientes/${id}`, function (html) {
                modal(html, "Ingredientes del Postre", [
                    {html: "Cerrar", class: "btn btn-secondary", fun: function (event) {
                        $(event.target).blur();
                        setTimeout(function() {
                            closeModal();
                        }, 10);
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

    // Editar postre
    $(document).off("click", ".btn-editar-postre").on("click", ".btn-editar-postre", function (event) {
        const id = $(this).data("id")
        
        $.get(`/postre/${id}`, function (data) {
            if (data.length > 0) {
                const postre = data[0]
                $("#txtNombre").val(postre.nombrePostre)
                $("#txtPrecio").val(postre.precio)
                
                if ($("#hiddenIdPostre").length === 0) {
                    $("#frmPostre").prepend('<input type="hidden" id="hiddenIdPostre" name="idPostre">')
                }
                $("#hiddenIdPostre").val(postre.idPostre)
                
                $('html, body').animate({
                    scrollTop: $("#frmPostre").offset().top
                }, 500)
            }
        }).fail(function(xhr, status, error) {
            console.error("Error al cargar postre:", error)
            alert("Error al cargar los datos del postre")
        })
    })

    // Eliminar postre
    $(document).off("click", ".btn-eliminar-postre").on("click", ".btn-eliminar-postre", function (event) {
        const id = $(this).data("id")
        const $btn = $(this);
        
        if (confirm("¿Está seguro de eliminar este postre?")) {
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
                $btn.prop('disabled', false);
            });
        }
    })

    // Cancelar edición
    $(document).off("click", "#btnCancelarPostre").on("click", "#btnCancelarPostre", function (event) {
        limpiarFormularioPostre()
    })
})

// ======================================
// CONTROLLER DE INGREDIENTES - CORREGIDO
// ======================================
app.controller("ingredientesCtrl", function ($scope, $http) {
    function buscarIngredientes() {
        $.get("/tbodyIngredientes", function (trsHTML) {
            $("#tbodyIngredientes").html(trsHTML)
        })
    }

    function limpiarFormularioIngrediente() {
        $("#frmIngredientes")[0].reset()
        $("#hiddenIdIngrediente").remove()
    }

    buscarIngredientes()
    
    // Desactivar logging de Pusher para producción
    Pusher.logToConsole = false;

    // Verificación para evitar Pusher duplicado para ingredientes
    if (typeof window.pusherIngredientes === 'undefined') {
        window.pusherIngredientes = new Pusher("48294aad3f28c3669613", {
            cluster: "us2"
        });

        var channel = window.pusherIngredientes.subscribe("canalIngredientes");
        channel.bind("eventoDeIngredientes", function(data) {
            console.log("Evento Pusher ingredientes recibido:", data);
            buscarIngredientes();
        });
    }

    // Guardar/actualizar ingrediente
    $(document).off("submit", "#frmIngredientes").on("submit", "#frmIngredientes", function (event) {
        event.preventDefault()

        // Deshabilitar botón durante el envío
        const $submitBtn = $(this).find('button[type="submit"]');
        $submitBtn.prop('disabled', true);

        $.post("/ingrediente", {
            idIngrediente: $("#hiddenIdIngrediente").val() || "",
            nombreIngrediente: $("#txtNombre").val(),
            existencias: $("#txtExistencias").val()
        }, function(response) {
            console.log("Ingrediente guardado:", response)
            limpiarFormularioIngrediente()
            buscarIngredientes()
            toast("Ingrediente guardado correctamente", 3, function() {
                console.log("Toast terminado")
            })
        }).fail(function(xhr, status, error) {
            console.error("Error al guardar ingrediente:", error)
            alert("Error al guardar el ingrediente")
        }).always(function() {
            $submitBtn.prop('disabled', false);
        })
    })

    // Editar ingrediente
    $(document).off("click", ".btn-editar-ingrediente").on("click", ".btn-editar-ingrediente", function (event) {
        const id = $(this).data("id")
        
        $.get(`/ingrediente/${id}`, function (data) {
            if (data.length > 0) {
                const ingrediente = data[0]
                $("#txtNombre").val(ingrediente.nombreIngrediente)
                $("#txtExistencias").val(ingrediente.existencias)
                
                if ($("#hiddenIdIngrediente").length === 0) {
                    $("#frmIngredientes").prepend('<input type="hidden" id="hiddenIdIngrediente" name="idIngrediente">')
                }
                $("#hiddenIdIngrediente").val(ingrediente.idIngrediente)
                
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
    $(document).off("click", ".btn-eliminar-ingrediente").on("click", ".btn-eliminar-ingrediente", function (event) {
        const id = $(this).data("id")
        const $btn = $(this);
        
        if (confirm("¿Está seguro de eliminar este ingrediente?")) {
            $btn.prop('disabled', true);
            
            $.post("/ingrediente/eliminar", {
                id: id
            }, function(response) {
                console.log("Ingrediente eliminado:", response)
                buscarIngredientes()
                toast("Ingrediente eliminado correctamente", 3)
            }).fail(function(xhr, status, error) {
                console.error("Error al eliminar ingrediente:", error)
                alert("Error al eliminar el ingrediente")
            }).always(function() {
                $btn.prop('disabled', false);
            });
        }
    })

    // Cancelar edición
    $(document).off("click", "#btnCancelarIngrediente").on("click", "#btnCancelarIngrediente", function (event) {
        limpiarFormularioIngrediente()
    })
})

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

// ======================================
// FUNCIONES ADICIONALES PARA MODAL
// ======================================

// Función mejorada para cerrar modal sin errores de aria-hidden
function closeModalFixed() {
    // Quitar focus de cualquier elemento dentro del modal
    $('#modal-message').find(':focus').blur();
    
    // Pequeño delay para que el blur tome efecto
    setTimeout(function() {
        // Remover aria-hidden antes de cerrar
        $('#modal-message').removeAttr('aria-hidden');
        
        // Cerrar el modal
        $('#modal-message').modal('hide');
        
        // Devolver focus al body
        $('body').focus();
    }, 10);
}

// Manejo de eventos de Bootstrap para evitar problemas de aria-hidden
$(document).ready(function() {
    // Cuando el modal se está ocultando
    $(document).on('hide.bs.modal', '#modal-message', function (e) {
        // Quitar focus de todos los elementos dentro del modal
        $(this).find(':focus').blur();
        
        // Remover aria-hidden temporalmente
        $(this).removeAttr('aria-hidden');
    });
    
    // Cuando el modal se ha ocultado completamente
    $(document).on('hidden.bs.modal', '#modal-message', function (e) {
        // Limpiar cualquier focus residual
        $('body').focus();
    });
});

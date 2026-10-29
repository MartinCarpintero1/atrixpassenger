
package com.atrixpassenger.backend.service;

import com.atrixpassenger.backend.entity.Destino;
import com.atrixpassenger.backend.repository.DestinoRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class DestinoService {

    private final DestinoRepository destinoRepository;

    public DestinoService(DestinoRepository destinoRepository) {
        this.destinoRepository = destinoRepository;
    }

    public List<Destino> listarTodos() {
        return destinoRepository.findAll();
    }

    public Destino buscarPorId(Integer id) {
        return destinoRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("No se encontró el destino con ID: " + id));
    }

    public Destino crear(Destino destino) {
        return destinoRepository.save(destino);
    }

    public Destino actualizar(Integer id, Destino datosActualizados) {
        Destino destino = buscarPorId(id);

        destino.setNombreDestino(datosActualizados.getNombreDestino());
        destino.setDescripcion(datosActualizados.getDescripcion());
        destino.setDificultad(datosActualizados.getDificultad());
        destino.setDuracionEstimada(datosActualizados.getDuracionEstimada());

        return destinoRepository.save(destino);
    }

    public void eliminar(Integer id) {
        Destino destino = buscarPorId(id);
        destinoRepository.delete(destino);
    }
}

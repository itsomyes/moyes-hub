import React, { useEffect, useState } from 'react';
import { Button, Field, Muted } from '../components/ui';
import { Sheet } from '../components/Sheet';
import { createCapture } from '../db/repos/captures';

/**
 * NOTA AL YO FUTURO
 * Cuatro campos fijos: que / por que / donde / que decir.
 * Solo "que" es obligatorio: si te obligo a rellenar cuatro campos, no capturas.
 */
export function CaptureSheet({
  visible,
  onClose,
  onSaved,
  initialWhat = '',
}: {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
  initialWhat?: string;
}) {
  const [what, setWhat] = useState(initialWhat);
  const [why, setWhy] = useState('');
  const [place, setPlace] = useState('');
  const [say, setSay] = useState('');

  useEffect(() => {
    if (visible) {
      setWhat(initialWhat);
      setWhy('');
      setPlace('');
      setSay('');
    }
  }, [visible, initialWhat]);

  async function save() {
    if (!what.trim()) return;
    await createCapture({ what, why, place, say });
    onSaved();
    onClose();
  }

  return (
    <Sheet visible={visible} onClose={onClose} title="Nota al yo futuro">
      <Muted>Sueltalo aqui y olvidate. Ya lo ordenaras en la bandeja.</Muted>
      <Field label="Que" value={what} onChangeText={setWhat} placeholder="Lo que no puedes perder" autoFocus />
      <Field label="Por que" value={why} onChangeText={setWhy} placeholder="Para que sirve esto" />
      <Field label="Donde" value={place} onChangeText={setPlace} placeholder="Sitio, app, persona" />
      <Field label="Que decir" value={say} onChangeText={setSay} placeholder="La frase exacta" multiline />
      <Button title="Guardar y soltar" onPress={save} disabled={!what.trim()} />
    </Sheet>
  );
}

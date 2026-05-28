const express = require('express');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 8080;

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const CAMPEONATO_ID = '00000000-0000-0000-0000-000000000001';

// Middleware para verificar se o usuário é Administrador
async function verificarAdmin(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Não autenticado' });

    // Verifica se o token de login é válido
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return res.status(401).json({ error: 'Sessão inválida' });

    // Busca a role na tabela perfis
    const { data: perfil, error: perfilError } = await supabase.from('perfis').select('role').eq('id', user.id).single();
    
    if (perfilError || perfil?.role !== 'admin') {
        return res.status(403).json({ error: 'Acesso negado: Apenas administradores.' });
    }

    req.user = user;
    next();
}

// Qualquer um (Admin ou Viewer) pode ver os dados do campeonato
app.get('/api/campeonato', async (req, res) => {
    let { data, error } = await supabase.from('campeonatos').select('*').eq('id', CAMPEONATO_ID).single();
    if (error && error.code === 'PGRST116') return res.json(null);
    res.json(data);
});

// Apenas ADMIN pode salvar ou alterar dados
app.post('/api/campeonato', verificarAdmin, async (req, res) => {
    const estado = { id: CAMPEONATO_ID, ...req.body };
    const { data, error } = await supabase.from('campeonatos').upsert(estado).select();
    if (error) return res.status(500).json({ error: error.message });
    res.json(data[0]);
});

// Apenas ADMIN pode resetar
app.post('/api/campeonato/reset', verificarAdmin, async (req, res) => {
    await supabase.from('campeonatos').delete().eq('id', CAMPEONATO_ID);
    res.json({ success: true });
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor seguro rodando na porta ${PORT}`);
});

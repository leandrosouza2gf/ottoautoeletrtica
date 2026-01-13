-- Remover role duplicado 'user' do admin (mantendo 'admin')
DELETE FROM user_roles 
WHERE user_id = '22d82bf6-3230-436e-bc4c-7aba5638abb0' 
AND role = 'user';

-- Adicionar constraint UNIQUE para evitar duplicatas futuras
ALTER TABLE user_roles 
ADD CONSTRAINT user_roles_user_id_unique UNIQUE (user_id);
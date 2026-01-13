export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      clientes: {
        Row: {
          created_at: string
          documento: string | null
          id: string
          nome: string
          observacoes: string | null
          telefone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          documento?: string | null
          id?: string
          nome: string
          observacoes?: string | null
          telefone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          documento?: string | null
          id?: string
          nome?: string
          observacoes?: string | null
          telefone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      colaboradores: {
        Row: {
          created_at: string
          funcao: string | null
          id: string
          nome: string
          tipo_comissao: Database["public"]["Enums"]["tipo_comissao"]
          updated_at: string
          user_id: string
          valor_comissao: number
        }
        Insert: {
          created_at?: string
          funcao?: string | null
          id?: string
          nome: string
          tipo_comissao?: Database["public"]["Enums"]["tipo_comissao"]
          updated_at?: string
          user_id: string
          valor_comissao?: number
        }
        Update: {
          created_at?: string
          funcao?: string | null
          id?: string
          nome?: string
          tipo_comissao?: Database["public"]["Enums"]["tipo_comissao"]
          updated_at?: string
          user_id?: string
          valor_comissao?: number
        }
        Relationships: []
      }
      comissoes: {
        Row: {
          colaborador_id: string | null
          created_at: string
          id: string
          os_id: string | null
          status: Database["public"]["Enums"]["status_comissao"]
          updated_at: string
          user_id: string
          valor: number
        }
        Insert: {
          colaborador_id?: string | null
          created_at?: string
          id?: string
          os_id?: string | null
          status?: Database["public"]["Enums"]["status_comissao"]
          updated_at?: string
          user_id: string
          valor?: number
        }
        Update: {
          colaborador_id?: string | null
          created_at?: string
          id?: string
          os_id?: string | null
          status?: Database["public"]["Enums"]["status_comissao"]
          updated_at?: string
          user_id?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "comissoes_colaborador_id_fkey"
            columns: ["colaborador_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comissoes_os_id_fkey"
            columns: ["os_id"]
            isOneToOne: false
            referencedRelation: "ordens_servico"
            referencedColumns: ["id"]
          },
        ]
      }
      entradas: {
        Row: {
          created_at: string
          data: string
          forma_pagamento: Database["public"]["Enums"]["forma_pagamento"]
          id: string
          os_id: string | null
          status: Database["public"]["Enums"]["status_pagamento"]
          updated_at: string
          user_id: string
          valor: number
        }
        Insert: {
          created_at?: string
          data?: string
          forma_pagamento?: Database["public"]["Enums"]["forma_pagamento"]
          id?: string
          os_id?: string | null
          status?: Database["public"]["Enums"]["status_pagamento"]
          updated_at?: string
          user_id: string
          valor?: number
        }
        Update: {
          created_at?: string
          data?: string
          forma_pagamento?: Database["public"]["Enums"]["forma_pagamento"]
          id?: string
          os_id?: string | null
          status?: Database["public"]["Enums"]["status_pagamento"]
          updated_at?: string
          user_id?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "entradas_os_id_fkey"
            columns: ["os_id"]
            isOneToOne: false
            referencedRelation: "ordens_servico"
            referencedColumns: ["id"]
          },
        ]
      }
      fornecedores: {
        Row: {
          created_at: string
          id: string
          nome: string
          observacoes: string | null
          telefone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          nome: string
          observacoes?: string | null
          telefone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
          observacoes?: string | null
          telefone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ordens_servico: {
        Row: {
          cliente_id: string
          created_at: string
          data_entrada: string
          defeito_identificado: string | null
          defeito_relatado: string
          id: string
          observacoes_tecnicas: string | null
          status: Database["public"]["Enums"]["status_os"]
          tecnico_id: string | null
          updated_at: string
          user_id: string
          veiculo_id: string
        }
        Insert: {
          cliente_id: string
          created_at?: string
          data_entrada?: string
          defeito_identificado?: string | null
          defeito_relatado?: string
          id?: string
          observacoes_tecnicas?: string | null
          status?: Database["public"]["Enums"]["status_os"]
          tecnico_id?: string | null
          updated_at?: string
          user_id: string
          veiculo_id: string
        }
        Update: {
          cliente_id?: string
          created_at?: string
          data_entrada?: string
          defeito_identificado?: string | null
          defeito_relatado?: string
          id?: string
          observacoes_tecnicas?: string | null
          status?: Database["public"]["Enums"]["status_os"]
          tecnico_id?: string | null
          updated_at?: string
          user_id?: string
          veiculo_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ordens_servico_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordens_servico_tecnico_id_fkey"
            columns: ["tecnico_id"]
            isOneToOne: false
            referencedRelation: "colaboradores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ordens_servico_veiculo_id_fkey"
            columns: ["veiculo_id"]
            isOneToOne: false
            referencedRelation: "veiculos"
            referencedColumns: ["id"]
          },
        ]
      }
      pecas: {
        Row: {
          created_at: string
          fornecedor_id: string | null
          id: string
          nome: string
          updated_at: string
          user_id: string
          valor_custo: number
        }
        Insert: {
          created_at?: string
          fornecedor_id?: string | null
          id?: string
          nome: string
          updated_at?: string
          user_id: string
          valor_custo?: number
        }
        Update: {
          created_at?: string
          fornecedor_id?: string | null
          id?: string
          nome?: string
          updated_at?: string
          user_id?: string
          valor_custo?: number
        }
        Relationships: [
          {
            foreignKeyName: "pecas_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id"]
          },
        ]
      }
      pecas_os: {
        Row: {
          created_at: string
          id: string
          ordem_servico_id: string
          peca_id: string | null
          quantidade: number
          user_id: string
          valor_unitario: number
        }
        Insert: {
          created_at?: string
          id?: string
          ordem_servico_id: string
          peca_id?: string | null
          quantidade?: number
          user_id: string
          valor_unitario?: number
        }
        Update: {
          created_at?: string
          id?: string
          ordem_servico_id?: string
          peca_id?: string | null
          quantidade?: number
          user_id?: string
          valor_unitario?: number
        }
        Relationships: [
          {
            foreignKeyName: "pecas_os_ordem_servico_id_fkey"
            columns: ["ordem_servico_id"]
            isOneToOne: false
            referencedRelation: "ordens_servico"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pecas_os_peca_id_fkey"
            columns: ["peca_id"]
            isOneToOne: false
            referencedRelation: "pecas"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          name?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      saidas: {
        Row: {
          created_at: string
          data: string
          forma_pagamento: Database["public"]["Enums"]["forma_pagamento"]
          id: string
          observacao: string | null
          tipo: Database["public"]["Enums"]["tipo_despesa"]
          updated_at: string
          user_id: string
          valor: number
        }
        Insert: {
          created_at?: string
          data?: string
          forma_pagamento?: Database["public"]["Enums"]["forma_pagamento"]
          id?: string
          observacao?: string | null
          tipo?: Database["public"]["Enums"]["tipo_despesa"]
          updated_at?: string
          user_id: string
          valor?: number
        }
        Update: {
          created_at?: string
          data?: string
          forma_pagamento?: Database["public"]["Enums"]["forma_pagamento"]
          id?: string
          observacao?: string | null
          tipo?: Database["public"]["Enums"]["tipo_despesa"]
          updated_at?: string
          user_id?: string
          valor?: number
        }
        Relationships: []
      }
      servicos_os: {
        Row: {
          created_at: string
          data: string
          descricao: string
          id: string
          ordem_servico_id: string
          user_id: string
          valor_mao_obra: number
        }
        Insert: {
          created_at?: string
          data?: string
          descricao: string
          id?: string
          ordem_servico_id: string
          user_id: string
          valor_mao_obra?: number
        }
        Update: {
          created_at?: string
          data?: string
          descricao?: string
          id?: string
          ordem_servico_id?: string
          user_id?: string
          valor_mao_obra?: number
        }
        Relationships: [
          {
            foreignKeyName: "servicos_os_ordem_servico_id_fkey"
            columns: ["ordem_servico_id"]
            isOneToOne: false
            referencedRelation: "ordens_servico"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      veiculos: {
        Row: {
          ano: string | null
          cliente_id: string
          created_at: string
          id: string
          modelo: string
          placa: string
          problema_informado: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ano?: string | null
          cliente_id: string
          created_at?: string
          id?: string
          modelo: string
          placa: string
          problema_informado?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ano?: string | null
          cliente_id?: string
          created_at?: string
          id?: string
          modelo?: string
          placa?: string
          problema_informado?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "veiculos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      bootstrap_first_admin: { Args: never; Returns: undefined }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      set_user_role_on_create: {
        Args: {
          target_role: Database["public"]["Enums"]["app_role"]
          target_user_id: string
        }
        Returns: undefined
      }
      update_user_role: {
        Args: {
          new_role: Database["public"]["Enums"]["app_role"]
          target_user_id: string
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "user"
      forma_pagamento: "dinheiro" | "pix" | "cartao" | "boleto"
      status_comissao: "pendente" | "paga"
      status_os:
        | "aguardando_diagnostico"
        | "em_conserto"
        | "aguardando_peca"
        | "concluido"
        | "entregue"
      status_pagamento: "recebido" | "pendente"
      tipo_comissao: "percentual" | "fixo"
      tipo_despesa: "compra_peca" | "comissao" | "fixo" | "outros"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
      forma_pagamento: ["dinheiro", "pix", "cartao", "boleto"],
      status_comissao: ["pendente", "paga"],
      status_os: [
        "aguardando_diagnostico",
        "em_conserto",
        "aguardando_peca",
        "concluido",
        "entregue",
      ],
      status_pagamento: ["recebido", "pendente"],
      tipo_comissao: ["percentual", "fixo"],
      tipo_despesa: ["compra_peca", "comissao", "fixo", "outros"],
    },
  },
} as const

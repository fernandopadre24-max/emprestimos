
"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Trash2 } from "lucide-react"
import type { Category } from "@/lib/types"

interface ManageCategoriesDialogProps {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  categories: Category[]
  onAddCategory: (category: Omit<Category, "id">) => void
  onDeleteCategory: (categoryId: string) => void
}

export function ManageCategoriesDialog({ isOpen, onOpenChange, categories, onAddCategory, onDeleteCategory }: ManageCategoriesDialogProps) {
    const [newCategoryName, setNewCategoryName] = useState("");
    const [activeTab, setActiveTab] = useState<"receita" | "despesa">("receita");

    const handleAdd = () => {
        if (!newCategoryName.trim()) return;
        onAddCategory({ name: newCategoryName, type: activeTab });
        setNewCategoryName("");
    }
    
    const revenueCategories = categories.filter(c => c.type === 'receita');
    const expenseCategories = categories.filter(c => c.type === 'despesa');

    const renderCategoryList = (list: Category[]) => (
        <div className="space-y-2 mt-4 max-h-60 overflow-y-auto pr-2">
            {list.length > 0 ? list.map(cat => (
                <div key={cat.id} className="flex items-center justify-between bg-muted/50 p-2 rounded-md">
                    <span>{cat.name}</span>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-600" onClick={() => onDeleteCategory(cat.id)}>
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            )) : <p className="text-sm text-muted-foreground text-center py-4">Nenhuma categoria encontrada.</p>}
        </div>
    );

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle>Gerenciar Categorias</DialogTitle>
                <DialogDescription>
                    Adicione ou remova categorias para organizar suas transações.
                </DialogDescription>
            </DialogHeader>
            <Tabs defaultValue="receita" className="w-full" onValueChange={(value) => setActiveTab(value as "receita" | "despesa")}>
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="receita">Receitas</TabsTrigger>
                    <TabsTrigger value="despesa">Despesas</TabsTrigger>
                </TabsList>
                <div className="py-4">
                    <div className="flex gap-2">
                        <Input 
                            placeholder="Nome da nova categoria" 
                            value={newCategoryName} 
                            onChange={(e) => setNewCategoryName(e.target.value)}
                        />
                        <Button onClick={handleAdd} size="icon">
                            <Plus className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
                <TabsContent value="receita">
                    {renderCategoryList(revenueCategories)}
                </TabsContent>
                <TabsContent value="despesa">
                    {renderCategoryList(expenseCategories)}
                </TabsContent>
            </Tabs>
        </DialogContent>
        </Dialog>
    )
}
